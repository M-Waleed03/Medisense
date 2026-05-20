import 'dart:convert';

import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:file_picker/file_picker.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:fl_chart/fl_chart.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_sign_in/google_sign_in.dart';
import 'package:http/http.dart' as http;

const firebaseApiKey = String.fromEnvironment('FIREBASE_API_KEY', defaultValue: 'AIzaSyCTHVDQFmyRHO-eMr2K0eaYj44G1acpG-o');
const firebaseAuthDomain = String.fromEnvironment('FIREBASE_AUTH_DOMAIN', defaultValue: 'medisense-593f1.firebaseapp.com');
const firebaseProjectId = String.fromEnvironment('FIREBASE_PROJECT_ID', defaultValue: 'medisense-593f1');
const firebaseStorageBucket = String.fromEnvironment('FIREBASE_STORAGE_BUCKET', defaultValue: 'medisense-593f1.firebasestorage.app');
const firebaseMessagingSenderId = String.fromEnvironment('FIREBASE_MESSAGING_SENDER_ID', defaultValue: '275790099694');
const firebaseAppId = String.fromEnvironment('FIREBASE_APP_ID', defaultValue: '1:275790099694:web:0b54298b76bbcff0f66fff');
const configuredAiApiUrl = String.fromEnvironment('AI_API_URL');
const webApiUrl = String.fromEnvironment('WEB_API_URL', defaultValue: 'http://localhost:3000');

bool firebaseReady = false;
String? startupError;

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  try {
    if (firebaseApiKey.isNotEmpty) {
      await Firebase.initializeApp(
        options: const FirebaseOptions(
          apiKey: firebaseApiKey,
          authDomain: firebaseAuthDomain,
          projectId: firebaseProjectId,
          storageBucket: firebaseStorageBucket,
          messagingSenderId: firebaseMessagingSenderId,
          appId: firebaseAppId,
        ),
      );
    } else {
      await Firebase.initializeApp();
    }
    firebaseReady = true;
  } catch (error) {
    startupError = error.toString();
  }
  runApp(const ProviderScope(child: MediSenseApp()));
}

String apiBaseUrl() {
  if (configuredAiApiUrl.isNotEmpty) return configuredAiApiUrl;
  if (kIsWeb) return 'http://127.0.0.1:8000';
  if (defaultTargetPlatform == TargetPlatform.android) return 'http://10.0.2.2:8000';
  return 'http://127.0.0.1:8000';
}

class MediSenseApp extends StatelessWidget {
  const MediSenseApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'MEDISENSE',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        useMaterial3: true,
        colorScheme: ColorScheme.fromSeed(seedColor: const Color(0xFF2563EB)),
        scaffoldBackgroundColor: const Color(0xFFF8FAFC),
      ),
      home: const AuthGate(),
    );
  }
}

class SplashScreen extends StatelessWidget {
  const SplashScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return const Scaffold(
      body: Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            CircularProgressIndicator(),
            SizedBox(height: 16),
            Text('Starting MEDISENSE...', style: TextStyle(fontWeight: FontWeight.w800)),
          ],
        ),
      ),
    );
  }
}

class SetupIssueScreen extends StatelessWidget {
  const SetupIssueScreen({required this.message, super.key});
  final String message;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SafeArea(
        child: ListView(
          padding: const EdgeInsets.all(24),
          children: [
            const SizedBox(height: 56),
            const Icon(Icons.medical_services_outlined, size: 54, color: Color(0xFF2563EB)),
            const SizedBox(height: 18),
            const Text('MEDISENSE setup needs attention', style: TextStyle(fontSize: 28, fontWeight: FontWeight.w900)),
            const SizedBox(height: 12),
            const Text('The app could not finish Firebase startup, so it is showing this fallback instead of a blank screen.'),
            const SizedBox(height: 16),
            GlassCard(child: Text(message)),
          ],
        ),
      ),
    );
  }
}

class AuthGate extends StatelessWidget {
  const AuthGate({super.key});

  @override
  Widget build(BuildContext context) {
    if (!firebaseReady) return SetupIssueScreen(message: startupError ?? 'Firebase is not configured for this platform.');
    return StreamBuilder<User?>(
      stream: FirebaseAuth.instance.authStateChanges(),
      builder: (context, snapshot) {
        if (snapshot.connectionState == ConnectionState.waiting) return const SplashScreen();
        if (snapshot.hasError) return SetupIssueScreen(message: snapshot.error.toString());
        final user = snapshot.data;
        if (user == null) return const AuthScreen();
        ensureProfile(user).catchError((_) {});
        return const MobileShell();
      },
    );
  }
}

Future<void> ensureProfile(User user) async {
  await FirebaseFirestore.instance.collection('users').doc(user.uid).set({
    'userId': user.uid,
    'fullName': user.displayName ?? user.email?.split('@').first ?? 'MEDISENSE user',
    'email': user.email ?? '',
    'profileImage': user.photoURL ?? '',
    'lastSeenAt': FieldValue.serverTimestamp(),
    'updatedAt': FieldValue.serverTimestamp(),
    'createdAt': FieldValue.serverTimestamp(),
  }, SetOptions(merge: true));
}

class AuthScreen extends StatefulWidget {
  const AuthScreen({super.key});

  @override
  State<AuthScreen> createState() => _AuthScreenState();
}

class _AuthScreenState extends State<AuthScreen> {
  final email = TextEditingController();
  final password = TextEditingController();
  final name = TextEditingController();
  bool signup = false;
  bool loading = false;
  String message = '';

  Future<void> submit() async {
    setState(() {
      loading = true;
      message = '';
    });
    try {
      UserCredential credential;
      if (signup) {
        credential = await FirebaseAuth.instance.createUserWithEmailAndPassword(email: email.text.trim(), password: password.text);
        await credential.user?.updateDisplayName(name.text.trim());
      } else {
        credential = await FirebaseAuth.instance.signInWithEmailAndPassword(email: email.text.trim(), password: password.text);
      }
      if (credential.user != null) await ensureProfile(credential.user!);
    } catch (error) {
      setState(() => message = error.toString());
    } finally {
      setState(() => loading = false);
    }
  }

  Future<void> googleLogin() async {
    setState(() => loading = true);
    try {
      final googleUser = await GoogleSignIn().signIn();
      final googleAuth = await googleUser?.authentication;
      if (googleAuth == null) return;
      final credential = GoogleAuthProvider.credential(accessToken: googleAuth.accessToken, idToken: googleAuth.idToken);
      final result = await FirebaseAuth.instance.signInWithCredential(credential);
      if (result.user != null) await ensureProfile(result.user!);
    } catch (error) {
      setState(() => message = error.toString());
    } finally {
      setState(() => loading = false);
    }
  }

  Future<void> resetPassword() async {
    if (email.text.trim().isEmpty) {
      setState(() => message = 'Enter your email first.');
      return;
    }
    await FirebaseAuth.instance.sendPasswordResetEmail(email: email.text.trim());
    setState(() => message = 'Password reset email sent.');
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: ListView(
        padding: const EdgeInsets.all(24),
        children: [
          const SizedBox(height: 72),
          const Text('MEDISENSE', style: TextStyle(fontSize: 40, fontWeight: FontWeight.w900)),
          const SizedBox(height: 8),
          const Text('Secure symptom checks, report analysis, chatbot guidance, and profile sync.'),
          const SizedBox(height: 28),
          if (signup) TextField(controller: name, decoration: const InputDecoration(labelText: 'Full name', border: OutlineInputBorder())),
          if (signup) const SizedBox(height: 12),
          TextField(controller: email, keyboardType: TextInputType.emailAddress, decoration: const InputDecoration(labelText: 'Email', border: OutlineInputBorder())),
          const SizedBox(height: 12),
          TextField(controller: password, obscureText: true, decoration: const InputDecoration(labelText: 'Password', border: OutlineInputBorder())),
          const SizedBox(height: 16),
          FilledButton.icon(onPressed: loading ? null : submit, icon: loading ? const SizedBox.square(dimension: 16, child: CircularProgressIndicator(strokeWidth: 2)) : const Icon(Icons.login), label: Text(signup ? 'Create account' : 'Sign in')),
          OutlinedButton.icon(onPressed: loading ? null : googleLogin, icon: const Icon(Icons.g_mobiledata), label: const Text('Continue with Google')),
          TextButton(onPressed: () => setState(() => signup = !signup), child: Text(signup ? 'Already have an account? Sign in' : 'Create an account')),
          TextButton(onPressed: resetPassword, child: const Text('Forgot password?')),
          if (message.isNotEmpty) GlassCard(child: Text(message)),
        ],
      ),
    );
  }
}

class MobileShell extends StatefulWidget {
  const MobileShell({super.key});

  @override
  State<MobileShell> createState() => _MobileShellState();
}

class _MobileShellState extends State<MobileShell> {
  int index = 0;
  final pages = const [DashboardScreen(), SymptomScreen(), ReportsScreen(), ChatScreen(), ProfileScreen(), SettingsScreen()];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('MEDISENSE', style: TextStyle(fontWeight: FontWeight.w900)),
        actions: [IconButton(onPressed: () => FirebaseAuth.instance.signOut(), icon: const Icon(Icons.logout))],
      ),
      body: pages[index],
      bottomNavigationBar: NavigationBar(
        selectedIndex: index,
        onDestinationSelected: (value) => setState(() => index = value),
        destinations: const [
          NavigationDestination(icon: Icon(Icons.dashboard_outlined), selectedIcon: Icon(Icons.dashboard), label: 'Home'),
          NavigationDestination(icon: Icon(Icons.monitor_heart_outlined), selectedIcon: Icon(Icons.monitor_heart), label: 'Symptoms'),
          NavigationDestination(icon: Icon(Icons.document_scanner_outlined), selectedIcon: Icon(Icons.document_scanner), label: 'Reports'),
          NavigationDestination(icon: Icon(Icons.smart_toy_outlined), selectedIcon: Icon(Icons.smart_toy), label: 'Chat'),
          NavigationDestination(icon: Icon(Icons.person_outline), selectedIcon: Icon(Icons.person), label: 'Profile'),
          NavigationDestination(icon: Icon(Icons.settings_outlined), selectedIcon: Icon(Icons.settings), label: 'Settings'),
        ],
      ),
    );
  }
}

class GlassCard extends StatelessWidget {
  const GlassCard({required this.child, super.key});
  final Widget child;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      margin: const EdgeInsets.only(bottom: 14),
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: const Color.fromRGBO(255, 255, 255, 0.92),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Colors.white),
        boxShadow: [const BoxShadow(color: Color.fromRGBO(96, 125, 139, 0.09), blurRadius: 30, offset: Offset(0, 16))],
      ),
      child: child,
    );
  }
}

class DashboardScreen extends StatelessWidget {
  const DashboardScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final userId = FirebaseAuth.instance.currentUser!.uid;
    return StreamBuilder<QuerySnapshot<Map<String, dynamic>>>(
      stream: FirebaseFirestore.instance.collection('medical_reports').where('userId', isEqualTo: userId).snapshots(),
      builder: (context, reportSnapshot) {
        return StreamBuilder<QuerySnapshot<Map<String, dynamic>>>(
          stream: FirebaseFirestore.instance.collection('symptom_checks').where('userId', isEqualTo: userId).snapshots(),
          builder: (context, symptomSnapshot) {
            final reports = [...?reportSnapshot.data?.docs]..sort((a, b) => readDate(b).compareTo(readDate(a)));
            final symptoms = [...?symptomSnapshot.data?.docs]..sort((a, b) => readDate(b).compareTo(readDate(a)));
            final spots = reports.take(8).toList().asMap().entries.map((entry) {
              final value = (entry.value.data()['platelets'] as num?)?.toDouble() ?? 0;
              return FlSpot(entry.key.toDouble(), value / 1000);
            }).toList();
            return ListView(
              padding: const EdgeInsets.all(16),
              children: [
                const Text('Health dashboard', style: TextStyle(fontSize: 28, fontWeight: FontWeight.w900)),
                const SizedBox(height: 12),
                GlassCard(child: Text(symptoms.isEmpty ? 'No symptom checks yet.' : 'Latest prediction: ${symptoms.first.data()['result']?['predictedDisease'] ?? 'Needs review'}')),
                GlassCard(child: Text(reports.isEmpty ? 'No uploaded reports yet.' : 'Latest report risk: ${reports.first.data()['riskLevel'] ?? 'low'}')),
                SizedBox(
                  height: 220,
                  child: GlassCard(
                    child: spots.isEmpty
                        ? const Center(child: Text('Upload CBC reports to see platelet trends.'))
                        : LineChart(LineChartData(titlesData: const FlTitlesData(show: false), borderData: FlBorderData(show: false), lineBarsData: [LineChartBarData(isCurved: true, color: const Color(0xFF2563EB), spots: spots)])),
                  ),
                ),
              ],
            );
          },
        );
      },
    );
  }
}

DateTime readDate(QueryDocumentSnapshot<Map<String, dynamic>> doc) {
  final value = doc.data()['createdAt'];
  return value is Timestamp ? value.toDate() : DateTime.fromMillisecondsSinceEpoch(0);
}

class SymptomScreen extends StatefulWidget {
  const SymptomScreen({super.key});

  @override
  State<SymptomScreen> createState() => _SymptomScreenState();
}

class _SymptomScreenState extends State<SymptomScreen> {
  final symptoms = ['fever', 'headache', 'body pain', 'chills', 'vomiting', 'nausea', 'rash', 'bleeding', 'abdominal pain', 'diarrhea', 'cough', 'sore throat', 'weakness', 'joint pain', 'appetite loss', 'travel history', 'mosquito exposure', 'recent contaminated food/water exposure'];
  final selected = <String>{};
  final text = TextEditingController();
  String result = 'Select symptoms or describe how you feel.';
  bool loading = false;

  Future<void> analyze({bool naturalText = false}) async {
    setState(() => loading = true);
    try {
      final endpoint = naturalText ? '/predict-text-symptoms' : '/predict-symptoms';
      final body = naturalText ? {'text': text.text.trim()} : {'symptoms': selected.toList()};
      final response = await http.post(Uri.parse('${apiBaseUrl()}$endpoint'), headers: {'Content-Type': 'application/json'}, body: jsonEncode(body));
      final data = jsonDecode(response.body) as Map<String, dynamic>;
      if (response.statusCode >= 300) throw data['detail'] ?? data['error'] ?? 'Prediction failed';
      await FirebaseFirestore.instance.collection(naturalText ? 'text_symptom_checks' : 'symptom_checks').add({
        'userId': FirebaseAuth.instance.currentUser!.uid,
        if (naturalText) 'text': text.text.trim() else 'symptoms': selected.toList(),
        'result': data,
        'createdAt': FieldValue.serverTimestamp(),
        'updatedAt': FieldValue.serverTimestamp(),
      });
      setState(() => result = '${data['predictedDisease']} - ${(((data['confidence'] as num?) ?? 0) * 100).round()}%\n${data['explanation'] ?? ''}\n${data['doctorAdvice'] ?? data['suggestedNextStep'] ?? ''}');
    } catch (err) {
      final text = err.toString();
      setState(() => result = text.contains('SocketException') || text.contains('Connection refused') ? 'AI service is temporarily unavailable. Please start the backend server.' : text);
    } finally {
      setState(() => loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        const Text('Symptom checker', style: TextStyle(fontSize: 28, fontWeight: FontWeight.w900)),
        const SizedBox(height: 12),
        Wrap(spacing: 8, runSpacing: 8, children: symptoms.map((item) => FilterChip(selected: selected.contains(item), label: Text(item), onSelected: (_) => setState(() => selected.contains(item) ? selected.remove(item) : selected.add(item)))).toList()),
        const SizedBox(height: 16),
        FilledButton.icon(onPressed: selected.isEmpty || loading ? null : () => analyze(), icon: const Icon(Icons.auto_awesome), label: Text(loading ? 'Analyzing...' : 'Predict disease')),
        const SizedBox(height: 16),
        TextField(controller: text, minLines: 2, maxLines: 4, onChanged: (_) => setState(() {}), decoration: const InputDecoration(labelText: 'Describe symptoms', border: OutlineInputBorder())),
        const SizedBox(height: 8),
        OutlinedButton.icon(onPressed: text.text.trim().isEmpty || loading ? null : () => analyze(naturalText: true), icon: const Icon(Icons.notes), label: const Text('Analyze text symptoms')),
        const SizedBox(height: 16),
        GlassCard(child: Text(result, style: const TextStyle(fontWeight: FontWeight.w700))),
      ],
    );
  }
}

class ReportsScreen extends StatefulWidget {
  const ReportsScreen({super.key});

  @override
  State<ReportsScreen> createState() => _ReportsScreenState();
}

class _ReportsScreenState extends State<ReportsScreen> {
  String result = 'Upload a PNG, JPG, WEBP, or PDF medical report.';
  bool loading = false;

  Future<void> pickAndUpload() async {
    final picked = await FilePicker.platform.pickFiles(withData: true, type: FileType.custom, allowedExtensions: ['png', 'jpg', 'jpeg', 'webp', 'pdf']);
    final file = picked?.files.single;
    if (file == null || file.bytes == null) return;
    setState(() => loading = true);
    try {
      final user = FirebaseAuth.instance.currentUser!;
      final token = await user.getIdToken();
      final upload = http.MultipartRequest('POST', Uri.parse('$webApiUrl/api/cloudinary-upload'));
      upload.headers['Authorization'] = 'Bearer $token';
      upload.fields['kind'] = 'report';
      upload.fields['userId'] = user.uid;
      upload.files.add(http.MultipartFile.fromBytes('file', file.bytes!, filename: file.name));
      final uploaded = await upload.send();
      final uploadBody = jsonDecode(await uploaded.stream.bytesToString()) as Map<String, dynamic>;
      if (uploaded.statusCode >= 300) throw uploadBody['error'] ?? 'Cloudinary upload failed';

      final ocr = await postJson('/ocr-report', {'fileUrl': uploadBody['secureUrl'], 'fileType': file.extension == 'pdf' ? 'application/pdf' : 'image/${file.extension}', 'fileName': file.name});
      final values = (ocr['extractedValues'] ?? ocr['extracted_data']) as Map<String, dynamic>;
      final analysis = await postJson('/analyze-report-values', {'values': values, 'symptoms': []});
      await FirebaseFirestore.instance.collection('medical_reports').add({
        'userId': user.uid,
        'fileUrl': uploadBody['secureUrl'],
        'publicId': uploadBody['publicId'],
        'fileType': file.extension,
        'file_name': file.name,
        'extractedText': ocr['extractedText'] ?? ocr['raw_text'] ?? '',
        'extractedValues': values,
        'analysisResult': analysis['summary'],
        'riskLevel': analysis['riskLevel'],
        'platelets': values['platelets'],
        'wbc': values['wbc'],
        'hemoglobin': values['hemoglobin'],
        'createdAt': FieldValue.serverTimestamp(),
        'updatedAt': FieldValue.serverTimestamp(),
      });
      setState(() => result = 'Platelets: ${values['platelets'] ?? 'N/A'}\nWBC: ${values['wbc'] ?? 'N/A'}\nHemoglobin: ${values['hemoglobin'] ?? 'N/A'}\n${analysis['summary']}');
    } catch (err) {
      setState(() => result = err.toString());
    } finally {
      setState(() => loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return ListView(padding: const EdgeInsets.all(16), children: [
      const Text('Report analysis', style: TextStyle(fontSize: 28, fontWeight: FontWeight.w900)),
      const SizedBox(height: 12),
      FilledButton.icon(onPressed: loading ? null : pickAndUpload, icon: const Icon(Icons.upload_file), label: Text(loading ? 'Analyzing...' : 'Upload report')),
      const SizedBox(height: 16),
      GlassCard(child: Text(result)),
    ]);
  }
}

Future<Map<String, dynamic>> postJson(String path, Map<String, dynamic> body) async {
  try {
    final response = await http.post(Uri.parse('${apiBaseUrl()}$path'), headers: {'Content-Type': 'application/json'}, body: jsonEncode(body));
    final data = jsonDecode(response.body) as Map<String, dynamic>;
    if (response.statusCode >= 300) throw data['detail'] ?? data['error'] ?? 'Request failed';
    return data;
  } catch (error) {
    final text = error.toString();
    if (text.contains('SocketException') || text.contains('Connection refused') || text.contains('XMLHttpRequest')) {
      throw 'AI assistant is temporarily unavailable. Please start the backend server.';
    }
    rethrow;
  }
}

class ChatScreen extends StatefulWidget {
  const ChatScreen({super.key});

  @override
  State<ChatScreen> createState() => _ChatScreenState();
}

class _ChatScreenState extends State<ChatScreen> {
  final controller = TextEditingController();
  bool loading = false;
  String errorMessage = '';
  String pendingMessage = '';
  static const quickQuestions = [
    'What are dengue symptoms?',
    'What does low platelets mean?',
    'When should I see a doctor?',
    'What tests are needed for fever?',
    'What is typhoid?',
    'What is malaria?',
  ];

  @override
  void dispose() {
    controller.dispose();
    super.dispose();
  }

  Future<void> send([String? quickQuestion]) async {
    final text = (quickQuestion ?? controller.text).trim();
    if (text.isEmpty || loading) return;
    final user = FirebaseAuth.instance.currentUser!;
    setState(() {
      loading = true;
      errorMessage = '';
      pendingMessage = text;
      controller.clear();
    });
    try {
      final healthContext = await currentChatContext(user.uid);
      final data = await postJson('/chatbot', {'message': text, 'userId': user.uid, 'context': healthContext, 'history': [], 'healthContext': healthContext});
      if (data['savedToFirestore'] != true) {
        await FirebaseFirestore.instance.collection('chatbot_messages').add({
          'userId': user.uid,
          'user_message': text,
          'ai_response': data['response'],
          'provider': data['provider'] ?? 'local_rules',
          'fallback': data['fallback'] ?? false,
          'healthContext': healthContext,
          'createdAt': FieldValue.serverTimestamp(),
          'updatedAt': FieldValue.serverTimestamp(),
        });
      }
    } catch (err) {
      final friendly = friendlyChatError(err);
      setState(() => errorMessage = friendly);
      await FirebaseFirestore.instance.collection('notifications').add({'userId': user.uid, 'type': 'chatbot_error', 'message': friendly, 'createdAt': FieldValue.serverTimestamp()});
    } finally {
      setState(() {
        loading = false;
        pendingMessage = '';
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final userId = FirebaseAuth.instance.currentUser!.uid;
    return Column(children: [
      Expanded(
        child: StreamBuilder<QuerySnapshot<Map<String, dynamic>>>(
          stream: FirebaseFirestore.instance.collection('chatbot_messages').where('userId', isEqualTo: userId).snapshots(),
          builder: (context, snapshot) {
            final docs = [...?snapshot.data?.docs]..sort((a, b) => readDate(a).compareTo(readDate(b)));
            return ListView(padding: const EdgeInsets.all(16), children: [
              const Text('MEDISENSE assistant', style: TextStyle(fontSize: 28, fontWeight: FontWeight.w900)),
              const SizedBox(height: 12),
              Wrap(spacing: 8, runSpacing: 8, children: quickQuestions.map((question) => ActionChip(label: Text(question), onPressed: loading ? null : () => send(question))).toList()),
              const SizedBox(height: 12),
              if (errorMessage.isNotEmpty) GlassCard(child: Text(errorMessage, style: const TextStyle(color: Colors.red, fontWeight: FontWeight.w700))),
              if (docs.isEmpty && pendingMessage.isEmpty && !loading) const GlassCard(child: Text('Ask MEDISENSE about symptoms, report values, precautions, or when to seek care.')),
              ...docs.expand((doc) => [
                    chatBubble(context, doc.data()['user_message']?.toString() ?? '', true),
                    chatBubble(context, doc.data()['ai_response']?.toString() ?? '', false),
                  ]),
              if (pendingMessage.isNotEmpty) chatBubble(context, pendingMessage, true),
              if (loading) typingBubble(context),
            ]);
          },
        ),
      ),
      Padding(
        padding: const EdgeInsets.all(12),
        child: Row(children: [
          Expanded(
            child: TextField(
              controller: controller,
              minLines: 1,
              maxLines: 3,
              onSubmitted: (_) => send(),
              decoration: InputDecoration(
                hintText: 'Ask MEDISENSE...',
                border: const OutlineInputBorder(),
                suffixIcon: controller.text.isEmpty ? null : IconButton(onPressed: () => setState(() => controller.clear()), icon: const Icon(Icons.close)),
              ),
              onChanged: (_) => setState(() {}),
            ),
          ),
          const SizedBox(width: 8),
          IconButton.filled(onPressed: loading ? null : () => send(), icon: loading ? const SizedBox.square(dimension: 18, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white)) : const Icon(Icons.send)),
        ]),
      ),
    ]);
  }

  Widget chatBubble(BuildContext context, String text, bool fromUser) {
    final width = MediaQuery.sizeOf(context).width * 0.82;
    return Align(
      alignment: fromUser ? Alignment.centerRight : Alignment.centerLeft,
      child: Container(
        constraints: BoxConstraints(maxWidth: width),
        margin: const EdgeInsets.only(bottom: 10),
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
        decoration: BoxDecoration(
          color: fromUser ? const Color(0xFF2563EB) : Colors.white,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: fromUser ? const Color(0xFF2563EB) : const Color(0xFFE2E8F0)),
        ),
        child: Text(text, style: TextStyle(color: fromUser ? Colors.white : const Color(0xFF334155), height: 1.35)),
      ),
    );
  }

  Widget typingBubble(BuildContext context) {
    return Align(
      alignment: Alignment.centerLeft,
      child: Container(
        margin: const EdgeInsets.only(bottom: 10),
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
        decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(12), border: Border.all(color: const Color(0xFFE2E8F0))),
        child: const Row(mainAxisSize: MainAxisSize.min, children: [SizedBox.square(dimension: 18, child: CircularProgressIndicator(strokeWidth: 2)), SizedBox(width: 12), Text('MEDISENSE is typing...')]),
      ),
    );
  }
}

Future<Map<String, dynamic>> currentChatContext(String userId) async {
  try {
    final profile = await FirebaseFirestore.instance.collection('users').doc(userId).get();
    final reportsSnapshot = await FirebaseFirestore.instance.collection('medical_reports').where('userId', isEqualTo: userId).limit(10).get();
    final symptomSnapshot = await FirebaseFirestore.instance.collection('symptom_checks').where('userId', isEqualTo: userId).limit(10).get();
    final reports = [...reportsSnapshot.docs]..sort((a, b) => readDate(b).compareTo(readDate(a)));
    final symptoms = [...symptomSnapshot.docs]..sort((a, b) => readDate(b).compareTo(readDate(a)));
    return {
      'profile': profile.data(),
      'latestReport': reports.isEmpty ? null : reports.first.data(),
      'latestSymptomCheck': symptoms.isEmpty ? null : symptoms.first.data(),
    };
  } catch (_) {
    return {};
  }
}

String friendlyChatError(Object error) {
  final text = error.toString().replaceFirst('Exception: ', '');
  final blocked = RegExp('failed to fetch|quota|provider|api key|groq|gemini|openrouter|rate-limit|insufficient', caseSensitive: false);
  if (blocked.hasMatch(text) || text.trim().isEmpty) return 'MEDISENSE could not answer right now. Please try again in a moment.';
  if (text.contains('SocketException') || text.contains('Connection refused') || text.contains('XMLHttpRequest')) return 'MEDISENSE is offline right now. Please start the local healthcare service and try again.';
  return text;
}

class ProfileScreen extends StatefulWidget {
  const ProfileScreen({super.key});

  @override
  State<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends State<ProfileScreen> {
  final fields = <String, TextEditingController>{
    'fullName': TextEditingController(),
    'age': TextEditingController(),
    'gender': TextEditingController(),
    'bloodGroup': TextEditingController(),
    'height': TextEditingController(),
    'weight': TextEditingController(),
    'allergies': TextEditingController(),
    'existingConditions': TextEditingController(),
    'emergencyContact': TextEditingController(),
    'address': TextEditingController(),
  };
  String message = '';

  @override
  void initState() {
    super.initState();
    load();
  }

  Future<void> load() async {
    final doc = await FirebaseFirestore.instance.collection('users').doc(FirebaseAuth.instance.currentUser!.uid).get();
    final data = doc.data() ?? {};
    for (final entry in fields.entries) {
      final value = data[entry.key];
      entry.value.text = value is List ? value.join(', ') : (value?.toString() ?? '');
    }
    setState(() {});
  }

  Future<void> save() async {
    await FirebaseFirestore.instance.collection('users').doc(FirebaseAuth.instance.currentUser!.uid).set({
      for (final entry in fields.entries) entry.key: ['allergies', 'existingConditions'].contains(entry.key) ? entry.value.text.split(',').map((item) => item.trim()).where((item) => item.isNotEmpty).toList() : entry.value.text.trim(),
      'userId': FirebaseAuth.instance.currentUser!.uid,
      'email': FirebaseAuth.instance.currentUser!.email,
      'updatedAt': FieldValue.serverTimestamp(),
    }, SetOptions(merge: true));
    setState(() => message = 'Profile saved.');
  }

  @override
  Widget build(BuildContext context) {
    return ListView(padding: const EdgeInsets.all(16), children: [
      const Text('Profile', style: TextStyle(fontSize: 28, fontWeight: FontWeight.w900)),
      const SizedBox(height: 12),
      ...fields.entries.map((entry) => Padding(padding: const EdgeInsets.only(bottom: 10), child: TextField(controller: entry.value, decoration: InputDecoration(labelText: entry.key, border: const OutlineInputBorder())))),
      FilledButton.icon(onPressed: save, icon: const Icon(Icons.save), label: const Text('Save profile')),
      if (message.isNotEmpty) GlassCard(child: Text(message)),
    ]);
  }
}

class SettingsScreen extends StatefulWidget {
  const SettingsScreen({super.key});

  @override
  State<SettingsScreen> createState() => _SettingsScreenState();
}

class _SettingsScreenState extends State<SettingsScreen> {
  bool emailNotifications = true;
  bool reportAlerts = true;
  bool symptomReminders = false;
  String theme = 'light';
  String message = '';

  Future<void> save() async {
    await FirebaseFirestore.instance.collection('user_settings').doc(FirebaseAuth.instance.currentUser!.uid).set({
      'userId': FirebaseAuth.instance.currentUser!.uid,
      'email_notifications': emailNotifications,
      'report_alerts': reportAlerts,
      'symptom_reminders': symptomReminders,
      'theme': theme,
      'updatedAt': FieldValue.serverTimestamp(),
      'createdAt': FieldValue.serverTimestamp(),
    }, SetOptions(merge: true));
    setState(() => message = 'Settings saved.');
  }

  @override
  Widget build(BuildContext context) {
    return ListView(padding: const EdgeInsets.all(16), children: [
      const Text('Settings', style: TextStyle(fontSize: 28, fontWeight: FontWeight.w900)),
      SwitchListTile(value: emailNotifications, onChanged: (value) => setState(() => emailNotifications = value), title: const Text('Email notifications')),
      SwitchListTile(value: reportAlerts, onChanged: (value) => setState(() => reportAlerts = value), title: const Text('Report alerts')),
      SwitchListTile(value: symptomReminders, onChanged: (value) => setState(() => symptomReminders = value), title: const Text('Symptom reminders')),
      DropdownButtonFormField(initialValue: theme, items: const [DropdownMenuItem(value: 'light', child: Text('Light')), DropdownMenuItem(value: 'system', child: Text('System'))], onChanged: (value) => setState(() => theme = value ?? 'light'), decoration: const InputDecoration(labelText: 'Theme')),
      const SizedBox(height: 12),
      FilledButton.icon(onPressed: save, icon: const Icon(Icons.save), label: const Text('Save settings')),
      OutlinedButton(onPressed: () => FirebaseAuth.instance.sendPasswordResetEmail(email: FirebaseAuth.instance.currentUser!.email!), child: const Text('Send password reset')),
      OutlinedButton(onPressed: () => FirebaseAuth.instance.signOut(), child: const Text('Logout')),
      OutlinedButton(onPressed: () => setState(() => message = 'Delete account requires a protected admin deletion endpoint.'), child: const Text('Request account deletion')),
      if (message.isNotEmpty) GlassCard(child: Text(message)),
    ]);
  }
}
