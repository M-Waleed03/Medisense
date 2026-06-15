import 'dart:convert';
import 'dart:ui';

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
import 'package:shared_preferences/shared_preferences.dart';
import 'package:url_launcher/url_launcher.dart';

const firebaseApiKey = String.fromEnvironment('FIREBASE_API_KEY',
    defaultValue: 'AIzaSyADvUziMGNd7hKAFG-WV_f0PuZP6RgfAOM');
const firebaseAuthDomain = String.fromEnvironment('FIREBASE_AUTH_DOMAIN',
    defaultValue: 'medisense-593f1.firebaseapp.com');
const firebaseProjectId = String.fromEnvironment('FIREBASE_PROJECT_ID',
    defaultValue: 'medisense-593f1');
const firebaseStorageBucket = String.fromEnvironment('FIREBASE_STORAGE_BUCKET',
    defaultValue: 'medisense-593f1.firebasestorage.app');
const firebaseMessagingSenderId = String.fromEnvironment(
    'FIREBASE_MESSAGING_SENDER_ID',
    defaultValue: '275790099694');
const firebaseAppId = String.fromEnvironment('FIREBASE_APP_ID',
    defaultValue: '1:275790099694:web:0b54298b76bbcff0f66fff');
const configuredAiApiUrl = String.fromEnvironment('AI_API_URL');
const configuredWebApiUrl = String.fromEnvironment('WEB_API_URL');

bool firebaseReady = false;
String? startupError;

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  try {
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
    firebaseReady = true;
  } catch (error) {
    startupError = error.toString();
  }
  runApp(const ProviderScope(child: MediSenseApp()));
}

String apiBaseUrl() {
  if (configuredAiApiUrl.isNotEmpty) return configuredAiApiUrl;
  if (kIsWeb) return 'http://127.0.0.1:8000';
  if (defaultTargetPlatform == TargetPlatform.android) {
    return 'http://10.0.2.2:8000';
  }
  return 'http://127.0.0.1:8000';
}

String webBaseUrl() {
  if (configuredWebApiUrl.isNotEmpty) return configuredWebApiUrl;
  if (kIsWeb) return 'http://127.0.0.1:3000';
  if (defaultTargetPlatform == TargetPlatform.android) {
    return 'http://10.0.2.2:3000';
  }
  return 'http://127.0.0.1:3000';
}

class MediSenseApp extends StatelessWidget {
  const MediSenseApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'MEDISENSE',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        brightness: Brightness.dark,
        useMaterial3: true,
        colorScheme: const ColorScheme.dark(
          primary: MediColors.primary,
          secondary: MediColors.ghostBlue,
          surface: MediColors.surface,
          onPrimary: MediColors.white,
          onSurface: MediColors.text,
          outline: MediColors.lead,
        ),
        scaffoldBackgroundColor: MediColors.background,
        fontFamily: 'Roboto',
        textTheme: ThemeData.dark().textTheme.apply(
              bodyColor: MediColors.text,
              displayColor: MediColors.text,
            ),
        iconTheme: const IconThemeData(color: MediColors.text),
        filledButtonTheme: FilledButtonThemeData(
          style: FilledButton.styleFrom(
            minimumSize: const Size(120, 52),
            backgroundColor: MediColors.primary,
            foregroundColor: MediColors.white,
            shape:
                RoundedRectangleBorder(borderRadius: BorderRadius.circular(32)),
            textStyle:
                const TextStyle(fontWeight: FontWeight.w500, fontSize: 15),
            elevation: 0,
          ),
        ),
        outlinedButtonTheme: OutlinedButtonThemeData(
          style: OutlinedButton.styleFrom(
            minimumSize: const Size.fromHeight(48),
            foregroundColor: MediColors.text,
            side: const BorderSide(color: MediColors.lead),
            shape:
                RoundedRectangleBorder(borderRadius: BorderRadius.circular(32)),
            textStyle: const TextStyle(fontWeight: FontWeight.w500),
          ),
        ),
        inputDecorationTheme: InputDecorationTheme(
          filled: true,
          fillColor: MediColors.graphite.withValues(alpha: 0.72),
          labelStyle: const TextStyle(color: MediColors.muted),
          hintStyle: const TextStyle(color: MediColors.muted),
          border: OutlineInputBorder(borderRadius: BorderRadius.circular(32)),
          enabledBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(32),
              borderSide: const BorderSide(color: MediColors.lead)),
          focusedBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(32),
              borderSide:
                  const BorderSide(color: MediColors.primary, width: 1.4)),
        ),
        chipTheme: ChipThemeData(
          backgroundColor: MediColors.graphite.withValues(alpha: 0.64),
          selectedColor: MediColors.primary,
          checkmarkColor: MediColors.white,
          labelStyle: const TextStyle(color: MediColors.text),
          secondaryLabelStyle: const TextStyle(color: MediColors.white),
          side: const BorderSide(color: MediColors.lead),
          shape:
              RoundedRectangleBorder(borderRadius: BorderRadius.circular(32)),
        ),
        navigationBarTheme: NavigationBarThemeData(
          backgroundColor: MediColors.surface.withValues(alpha: 0.88),
          indicatorColor: MediColors.ghostBlue.withValues(alpha: 0.12),
          labelTextStyle: WidgetStateProperty.all(
              const TextStyle(color: MediColors.muted, fontSize: 12)),
          iconTheme: WidgetStateProperty.all(
              const IconThemeData(color: MediColors.text)),
        ),
      ),
      home: const AuthGate(),
    );
  }
}

class MediColors {
  static const primary = Color(0xFF5266EB);
  static const ghostBlue = Color(0xFFCDDDFF);
  static const secondary = ghostBlue;
  static const accent = primary;
  static const cyan = ghostBlue;
  static const background = Color(0xFF171721);
  static const surface = Color(0xFF1E1E2A);
  static const graphite = Color(0xFF272735);
  static const lead = Color(0xFF70707D);
  static const text = Color(0xFFEDEDF3);
  static const white = Color(0xFFFFFFFF);
  static const ink = text;
  static const muted = Color(0xFFC3C3CC);
}

class AuthGate extends StatelessWidget {
  const AuthGate({super.key});

  @override
  Widget build(BuildContext context) {
    if (!firebaseReady) {
      return SetupIssueScreen(
          message:
              startupError ?? 'Firebase is not configured for this platform.');
    }
    return StreamBuilder<User?>(
      stream: FirebaseAuth.instance.authStateChanges(),
      builder: (context, snapshot) {
        if (snapshot.connectionState == ConnectionState.waiting) {
          return const SplashScreen();
        }
        if (snapshot.hasError) {
          return SetupIssueScreen(message: snapshot.error.toString());
        }
        final user = snapshot.data;
        if (user == null) return const OnboardingAuthShell();
        ensureProfile(user).catchError((_) {});
        return const MobileShell();
      },
    );
  }
}

class SplashScreen extends StatelessWidget {
  const SplashScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: PremiumBackground(
        child: Center(
          child: TweenAnimationBuilder<double>(
            tween: Tween(begin: 0.82, end: 1),
            duration: const Duration(milliseconds: 900),
            curve: Curves.easeOutCubic,
            builder: (context, scale, child) => Transform.scale(
              scale: scale,
              child: child,
            ),
            child: const GlassCard(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  DoctorMark(size: 82),
                  SizedBox(height: 18),
                  Text('MEDISENSE',
                      style:
                          TextStyle(fontSize: 30, fontWeight: FontWeight.w300)),
                  SizedBox(height: 6),
                  Text('AI doctor workspace initializing',
                      style: TextStyle(
                          color: MediColors.muted,
                          fontWeight: FontWeight.w400)),
                  SizedBox(height: 18),
                  LinearProgressIndicator(minHeight: 6),
                ],
              ),
            ),
          ),
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
        child: PremiumBackground(
          child: ListView(
            padding: const EdgeInsets.all(24),
            children: [
              const SizedBox(height: 56),
              const DoctorMark(size: 64),
              const SizedBox(height: 18),
              const Text('MEDISENSE setup needs attention',
                  style: TextStyle(fontSize: 28, fontWeight: FontWeight.w300)),
              const SizedBox(height: 12),
              const Text(
                  'Firebase could not start, so MEDISENSE is showing this setup screen instead of a blank app.'),
              const SizedBox(height: 16),
              GlassCard(child: Text(message)),
            ],
          ),
        ),
      ),
    );
  }
}

Future<void> ensureProfile(User user) async {
  final ref = FirebaseFirestore.instance.collection('users').doc(user.uid);
  final snapshot = await ref.get();
  final base = {
    'userId': user.uid,
    'fullName':
        user.displayName ?? user.email?.split('@').first ?? 'MEDISENSE user',
    'email': user.email ?? '',
    'profileImage': user.photoURL ?? '',
    'lastSeenAt': FieldValue.serverTimestamp(),
    'updatedAt': FieldValue.serverTimestamp(),
  };
  await ref.set(
      snapshot.exists
          ? base
          : {...base, 'createdAt': FieldValue.serverTimestamp()},
      SetOptions(merge: true));
}

class OnboardingAuthShell extends StatefulWidget {
  const OnboardingAuthShell({super.key});

  @override
  State<OnboardingAuthShell> createState() => _OnboardingAuthShellState();
}

class _OnboardingAuthShellState extends State<OnboardingAuthShell> {
  int page = 0;
  bool showAuth = false;

  static const slides = [
    (
      'AI doctor workspace',
      'Analyze symptoms, reports, and chat guidance in one secure MEDISENSE account.',
      Icons.smart_toy_outlined
    ),
    (
      'Shared health history',
      'Web and mobile use the same Firebase Auth and Firestore collections.',
      Icons.sync_outlined
    ),
    (
      'Safe medical fallback',
      'If external AI is unavailable, local medical rules still answer core health questions.',
      Icons.health_and_safety_outlined
    ),
  ];

  @override
  Widget build(BuildContext context) {
    if (showAuth) return const AuthScreen();
    final slide = slides[page];
    return Scaffold(
      body: SafeArea(
        child: PremiumBackground(
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 22),
            child: Column(
              children: [
                Row(
                  children: [
                    const DoctorMark(size: 56),
                    const SizedBox(width: 14),
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: const [
                        Text('MEDISENSE',
                            style: TextStyle(
                                fontSize: 18,
                                fontWeight: FontWeight.w500,
                                letterSpacing: 0.6)),
                        SizedBox(height: 4),
                        Text('Your AI health workspace',
                            style: TextStyle(
                                color: MediColors.muted, fontSize: 13)),
                      ],
                    ),
                    const Spacer(),
                    TextButton(
                        onPressed: () => setState(() => showAuth = true),
                        child: const Text('Skip')),
                  ],
                ),
                const SizedBox(height: 22),
                GlassCard(
                  margin: EdgeInsets.zero,
                  padding: const EdgeInsets.fromLTRB(26, 26, 26, 24),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Container(
                            padding: const EdgeInsets.all(16),
                            decoration: BoxDecoration(
                              color: MediColors.background.withValues(alpha: 0.42),
                              borderRadius: BorderRadius.circular(22),
                            ),
                            child: Icon(slide.$3,
                                color: MediColors.primary, size: 34),
                          ),
                          Container(
                            padding: const EdgeInsets.symmetric(
                                horizontal: 14, vertical: 8),
                            decoration: BoxDecoration(
                              color: MediColors.graphite.withValues(alpha: 0.42),
                              borderRadius: BorderRadius.circular(32),
                            ),
                            child: Text('${page + 1}/${slides.length}',
                                style: const TextStyle(
                                    color: MediColors.muted, fontSize: 12)),
                          )
                        ],
                      ),
                      const SizedBox(height: 28),
                      Text(slide.$1,
                          style: const TextStyle(
                              fontSize: 34,
                              fontWeight: FontWeight.w300,
                              height: 1.1,
                              color: MediColors.text)),
                      const SizedBox(height: 18),
                      Text(slide.$2,
                          style: const TextStyle(
                              height: 1.6,
                              fontSize: 16,
                              color: MediColors.muted)),
                      const SizedBox(height: 30),
                      Row(
                        children: List.generate(
                          slides.length,
                          (index) => AnimatedContainer(
                            duration: const Duration(milliseconds: 220),
                            margin: const EdgeInsets.only(right: 10),
                            height: 8,
                            width: page == index ? 30 : 8,
                            decoration: BoxDecoration(
                              color: page == index
                                  ? MediColors.primary
                                  : MediColors.lead,
                              borderRadius: BorderRadius.circular(10),
                            ),
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 28),
                Row(
                  children: [
                    Expanded(
                      child: FilledButton.icon(
                        onPressed: () {
                          if (page == slides.length - 1) {
                            setState(() => showAuth = true);
                          } else {
                            setState(() => page += 1);
                          }
                        },
                        icon: const Icon(Icons.arrow_forward),
                        label: Text(
                            page == slides.length - 1 ? 'Get started' : 'Next'),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 18),
                Center(
                  child: TextButton(
                    onPressed: () => setState(() => showAuth = true),
                    child: const Text('Already have an account? Sign in'),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
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

  @override
  void dispose() {
    email.dispose();
    password.dispose();
    name.dispose();
    super.dispose();
  }

  Future<void> submit() async {
    setState(() {
      loading = true;
      message = '';
    });
    try {
      UserCredential credential;
      if (signup) {
        credential = await FirebaseAuth.instance.createUserWithEmailAndPassword(
            email: email.text.trim(), password: password.text);
        if (name.text.trim().isNotEmpty) {
          await credential.user?.updateDisplayName(name.text.trim());
        }
      } else {
        credential = await FirebaseAuth.instance.signInWithEmailAndPassword(
            email: email.text.trim(), password: password.text);
      }
      if (credential.user != null) await ensureProfile(credential.user!);
    } catch (error) {
      setState(() => message = friendlyAuthError(error));
    } finally {
      if (mounted) setState(() => loading = false);
    }
  }

  Future<void> googleLogin() async {
    setState(() {
      loading = true;
      message = '';
    });
    try {
      UserCredential result;
      if (kIsWeb) {
        result =
            await FirebaseAuth.instance.signInWithPopup(GoogleAuthProvider());
      } else {
        final googleUser = await GoogleSignIn().signIn();
        final googleAuth = await googleUser?.authentication;
        if (googleAuth == null) {
          setState(() => message = 'Google sign-in was cancelled.');
          return;
        }
        final credential = GoogleAuthProvider.credential(
            accessToken: googleAuth.accessToken, idToken: googleAuth.idToken);
        result = await FirebaseAuth.instance.signInWithCredential(credential);
      }
      if (result.user != null) await ensureProfile(result.user!);
    } catch (error) {
      setState(() => message = friendlyAuthError(error));
    } finally {
      if (mounted) setState(() => loading = false);
    }
  }

  Future<void> resetPassword() async {
    if (email.text.trim().isEmpty) {
      setState(
          () => message = 'Enter your email first, then request a reset link.');
      return;
    }
    try {
      await FirebaseAuth.instance
          .sendPasswordResetEmail(email: email.text.trim());
      setState(() => message = 'Password reset email sent.');
    } catch (error) {
      setState(() => message = friendlyAuthError(error));
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SafeArea(
        child: PremiumBackground(
          child: ListView(
            padding: const EdgeInsets.all(24),
            children: [
              const SizedBox(height: 28),
              const DoctorMark(size: 58),
              const SizedBox(height: 24),
              Text(
                  signup
                      ? 'Create your MEDISENSE account'
                      : 'Welcome back to MEDISENSE',
                  style: const TextStyle(
                      fontSize: 32,
                      fontWeight: FontWeight.w300,
                      color: MediColors.text)),
              const SizedBox(height: 8),
              const Text('Use the same Firebase credentials on web and mobile.',
                  style: TextStyle(color: MediColors.muted)),
              const SizedBox(height: 24),
              GlassCard(
                child: Column(
                  children: [
                    if (signup)
                      TextField(
                          controller: name,
                          textInputAction: TextInputAction.next,
                          decoration: const InputDecoration(
                              labelText: 'Full name',
                              prefixIcon: Icon(Icons.person_outline))),
                    if (signup) const SizedBox(height: 12),
                    TextField(
                        controller: email,
                        keyboardType: TextInputType.emailAddress,
                        textInputAction: TextInputAction.next,
                        decoration: const InputDecoration(
                            labelText: 'Email',
                            prefixIcon: Icon(Icons.email_outlined))),
                    const SizedBox(height: 12),
                    TextField(
                        controller: password,
                        obscureText: true,
                        decoration: const InputDecoration(
                            labelText: 'Password',
                            prefixIcon: Icon(Icons.lock_outline))),
                    const SizedBox(height: 16),
                    SizedBox(
                      width: double.infinity,
                      child: FilledButton.icon(
                        onPressed: loading ? null : submit,
                        icon: loading
                            ? const SizedBox.square(
                                dimension: 16,
                                child: CircularProgressIndicator(
                                    strokeWidth: 2, color: Colors.white))
                            : const Icon(Icons.login),
                        label: Text(signup ? 'Create account' : 'Sign in'),
                      ),
                    ),
                    const SizedBox(height: 10),
                    SizedBox(
                      width: double.infinity,
                      child: OutlinedButton.icon(
                          onPressed: loading ? null : googleLogin,
                          icon: const Icon(Icons.g_mobiledata),
                          label: const Text('Continue with Google')),
                    ),
                    TextButton(
                        onPressed: loading
                            ? null
                            : () => setState(() => signup = !signup),
                        child: Text(signup
                            ? 'Already have an account? Sign in'
                            : 'Create an account')),
                    TextButton(
                        onPressed: loading ? null : resetPassword,
                        child: const Text('Forgot password?')),
                  ],
                ),
              ),
              if (message.isNotEmpty)
                GlassCard(
                    child: Text(message,
                        style: const TextStyle(fontWeight: FontWeight.w400))),
            ],
          ),
        ),
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
  final pages = const [
    DashboardScreen(),
    SymptomScreen(),
    DoctorsScreen(),
    ReportsScreen(),
    ChatScreen(),
    HistoryScreen(),
    ProfileScreen(),
    SettingsScreen()
  ];
  final labels = const [
    'Dashboard',
    'Symptoms',
    'Doctors',
    'Reports',
    'Chatbot',
    'History',
    'Profile',
    'Settings'
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      extendBody: true,
      body: PremiumBackground(
        child: SafeArea(
          bottom: false,
          child: Column(
            children: [
              Padding(
                padding: const EdgeInsets.fromLTRB(16, 10, 16, 8),
                child: GlassCard(
                  margin: EdgeInsets.zero,
                  padding:
                      const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                  child: Row(children: [
                    const DoctorMark(size: 42),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Text('MEDISENSE',
                                style: TextStyle(
                                    fontWeight: FontWeight.w500,
                                    color: MediColors.text,
                                    letterSpacing: 0.8)),
                            Text(labels[index],
                                style: const TextStyle(
                                    color: MediColors.muted,
                                    fontWeight: FontWeight.w400)),
                          ]),
                    ),
                    IconButton(
                        onPressed: () => FirebaseAuth.instance.signOut(),
                        icon: const Icon(Icons.logout),
                        tooltip: 'Logout'),
                  ]),
                ),
              ),
              Expanded(
                child: AnimatedSwitcher(
                  duration: const Duration(milliseconds: 360),
                  switchInCurve: Curves.easeOutCubic,
                  switchOutCurve: Curves.easeInCubic,
                  child: KeyedSubtree(key: ValueKey(index), child: pages[index]),
                ),
              ),
            ],
          ),
        ),
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: () => setState(() => index = 3),
        backgroundColor: MediColors.primary,
        foregroundColor: MediColors.white,
        elevation: 0,
        child: const Icon(Icons.smart_toy_outlined),
      ),
      bottomNavigationBar: SafeArea(
        top: false,
        child: Padding(
          padding: const EdgeInsets.fromLTRB(12, 0, 12, 12),
          child: ClipRRect(
            borderRadius: BorderRadius.circular(32),
            child: BackdropFilter(
              filter: ImageFilter.blur(sigmaX: 22, sigmaY: 22),
              child: NavigationBar(
                selectedIndex: index,
                height: 72,
                backgroundColor: MediColors.surface.withValues(alpha: 0.92),
                indicatorColor: MediColors.ghostBlue.withValues(alpha: 0.12),
                labelBehavior:
                    NavigationDestinationLabelBehavior.onlyShowSelected,
                onDestinationSelected: (value) => setState(() => index = value),
                destinations: const [
                  NavigationDestination(
                      icon: Icon(Icons.dashboard_outlined),
                      selectedIcon: Icon(Icons.dashboard),
                      label: 'Home'),
                  NavigationDestination(
                      icon: Icon(Icons.monitor_heart_outlined),
                      selectedIcon: Icon(Icons.monitor_heart),
                      label: 'Symptoms'),
                  NavigationDestination(
                    icon: Icon(Icons.medical_services_outlined),
                    selectedIcon: Icon(Icons.medical_services),
                    label: 'Doctors'),
                  NavigationDestination(
                      icon: Icon(Icons.document_scanner_outlined),
                      selectedIcon: Icon(Icons.document_scanner),
                      label: 'Reports'),
                  NavigationDestination(
                      icon: Icon(Icons.smart_toy_outlined),
                      selectedIcon: Icon(Icons.smart_toy),
                      label: 'Chat'),
                  NavigationDestination(
                      icon: Icon(Icons.history_outlined),
                      selectedIcon: Icon(Icons.history),
                      label: 'History'),
                  NavigationDestination(
                      icon: Icon(Icons.person_outline),
                      selectedIcon: Icon(Icons.person),
                      label: 'Profile'),
                  NavigationDestination(
                      icon: Icon(Icons.settings_outlined),
                      selectedIcon: Icon(Icons.settings),
                      label: 'Settings'),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}

class DashboardScreen extends StatelessWidget {
  const DashboardScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final userId = FirebaseAuth.instance.currentUser!.uid;
    return StreamBuilder<DocumentSnapshot<Map<String, dynamic>>>(
      stream: FirebaseFirestore.instance
          .collection('users')
          .doc(userId)
          .snapshots(),
      builder: (context, profileSnapshot) {
        final profile = profileSnapshot.data?.data() ?? {};
        return StreamBuilder<QuerySnapshot<Map<String, dynamic>>>(
          stream: FirebaseFirestore.instance
              .collection('medical_reports')
              .where('userId', isEqualTo: userId)
              .snapshots(),
          builder: (context, reportSnapshot) {
            return StreamBuilder<QuerySnapshot<Map<String, dynamic>>>(
              stream: FirebaseFirestore.instance
                  .collection('symptom_checks')
                  .where('userId', isEqualTo: userId)
                  .snapshots(),
              builder: (context, symptomSnapshot) {
                return StreamBuilder<QuerySnapshot<Map<String, dynamic>>>(
                  stream: FirebaseFirestore.instance
                      .collection('chatbot_messages')
                      .where('userId', isEqualTo: userId)
                      .snapshots(),
                  builder: (context, chatSnapshot) {
                    final reports = sortedDocs(reportSnapshot.data?.docs ?? []);
                    final symptoms =
                        sortedDocs(symptomSnapshot.data?.docs ?? []);
                    final chats = sortedDocs(chatSnapshot.data?.docs ?? []);
                    final latestSymptom =
                        symptoms.isEmpty ? null : symptoms.first.data();
                    final latestReport =
                        reports.isEmpty ? null : reports.first.data();
                    final completion = profileCompletion(profile);
                    return ListView(
                      padding: const EdgeInsets.all(16),
                      children: [
                        const SectionTitle(
                            title: 'AI healthcare overview',
                            subtitle:
                                'Live Firestore data from your authenticated MEDISENSE account.'),
                        GlassCard(
                          child: Row(children: [
                            const DoctorMark(size: 58),
                            const SizedBox(width: 14),
                            Expanded(
                              child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(
                                        'Hello ${profile['fullName'] ?? FirebaseAuth.instance.currentUser?.email?.split('@').first ?? 'there'}',
                                        style: const TextStyle(
                                            fontSize: 22,
                                            fontWeight: FontWeight.w300,
                                            color: MediColors.ink)),
                                    const SizedBox(height: 6),
                                    const Text(
                                        'Your AI care cockpit is tracking reports, symptoms, chat context, and profile completeness.',
                                        style: TextStyle(
                                            color: MediColors.muted,
                                            height: 1.35,
                                            fontWeight: FontWeight.w400)),
                                  ]),
                            ),
                          ]),
                        ),
                        GridView.count(
                          crossAxisCount:
                              MediaQuery.sizeOf(context).width > 720 ? 4 : 2,
                          shrinkWrap: true,
                          physics: const NeverScrollableScrollPhysics(),
                          crossAxisSpacing: 12,
                          mainAxisSpacing: 12,
                          childAspectRatio: 1.15,
                          children: [
                            MetricTile(
                                label: 'Profile',
                                value: '$completion%',
                                icon: Icons.person_outline,
                                color: MediColors.primary),
                            MetricTile(
                                label: 'Prediction',
                                value: latestSymptom?['result']
                                            ?['predictedDisease']
                                        ?.toString() ??
                                    latestSymptom?['result']?['prediction']
                                        ?.toString() ??
                                    'No checks',
                                icon: Icons.monitor_heart_outlined,
                                color: MediColors.secondary),
                            MetricTile(
                                label: 'Report risk',
                                value: latestReport?['riskLevel']?.toString() ??
                                    'No reports',
                                icon: Icons.document_scanner_outlined,
                                color: MediColors.accent),
                            MetricTile(
                                label: 'Chat messages',
                                value: chats.length.toString(),
                                icon: Icons.smart_toy_outlined,
                                color: MediColors.ghostBlue),
                          ],
                        ),
                        const SizedBox(height: 14),
                        GlassCard(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              const Text('CBC trends',
                                  style: TextStyle(
                                      fontSize: 18,
                                      fontWeight: FontWeight.w500)),
                              const SizedBox(height: 12),
                              SizedBox(
                                height: 230,
                                child: reports.isEmpty
                                    ? const EmptyState(
                                        text:
                                            'Upload CBC reports to see platelet and WBC trends.')
                                    : LineChart(LineChartData(
                                        titlesData:
                                            const FlTitlesData(show: false),
                                        borderData: FlBorderData(show: false),
                                        gridData: const FlGridData(show: true),
                                        lineBarsData: [
                                          LineChartBarData(
                                              isCurved: true,
                                              color: MediColors.primary,
                                              spots: chartSpots(
                                                  reports, 'platelets',
                                                  divisor: 1000),
                                              barWidth: 3,
                                              dotData:
                                                  const FlDotData(show: false)),
                                          LineChartBarData(
                                              isCurved: true,
                                              color: MediColors.secondary,
                                              spots: chartSpots(reports, 'wbc'),
                                              barWidth: 3,
                                              dotData:
                                                  const FlDotData(show: false)),
                                        ],
                                      )),
                              ),
                            ],
                          ),
                        ),
                        DashboardTimeline(
                            title: 'Symptom history',
                            docs: symptoms,
                            empty: 'No symptom checks yet.',
                            builder: (data) =>
                                '${data['result']?['predictedDisease'] ?? data['result']?['prediction'] ?? 'Needs review'} - ${confidenceText(data['result']?['confidence'])}'),
                        DashboardTimeline(
                            title: 'Report history',
                            docs: reports,
                            empty: 'No medical reports yet.',
                            builder: (data) =>
                                '${data['file_name'] ?? 'Report'} - ${data['analysisResult'] ?? data['diagnosis'] ?? 'Saved analysis'}'),
                        DashboardTimeline(
                            title: 'Chatbot history',
                            docs: chats,
                            empty:
                                'Ask MEDISENSE a question to save chatbot history.',
                            builder: (data) =>
                                data['user_message']?.toString() ??
                                'Chat message'),
                      ],
                    );
                  },
                );
              },
            );
          },
        );
      },
    );
  }
}

class SymptomScreen extends StatefulWidget {
  const SymptomScreen({super.key});

  @override
  State<SymptomScreen> createState() => _SymptomScreenState();
}

class _SymptomScreenState extends State<SymptomScreen> {
  final selected = <String>{};
  final text = TextEditingController();
  final temperature = TextEditingController();
  final duration = TextEditingController();
  String feverLevel = 'moderate';
  String feverPattern = 'continuous';
  String result = '';
  bool loading = false;
  bool textLoading = false;

  static const groups = {
    'General': [
      'fever',
      'headache',
      'body pain',
      'weakness',
      'fatigue',
      'chills',
      'sweating',
      'joint pain',
      'appetite loss'
    ],
    'Digestive': [
      'nausea',
      'vomiting',
      'diarrhea',
      'abdominal pain',
      'constipation',
      'stomach cramps'
    ],
    'Respiratory': [
      'cough',
      'sore throat',
      'runny nose',
      'chest discomfort',
      'breathing difficulty'
    ],
    'Dengue indicators': [
      'rash',
      'eye pain',
      'bleeding gums',
      'nose bleeding',
      'low platelets if known',
      'low WBC',
      'mosquito exposure'
    ],
    'Malaria indicators': [
      'chills with sweating',
      'recent mosquito bite',
      'travel to malaria area',
      'repeated fever cycles'
    ],
    'Typhoid indicators': [
      'contaminated food/water exposure',
      'persistent fever',
      'diarrhea or constipation',
      'coated tongue if applicable'
    ],
    'Risk factors': [
      'recent travel',
      'contact with sick person',
      'existing medical condition',
      'pregnancy',
      'child/elderly patient',
      'low immunity'
    ],
  };

  @override
  void dispose() {
    text.dispose();
    temperature.dispose();
    duration.dispose();
    super.dispose();
  }

  Future<void> analyze({bool naturalText = false}) async {
    if (naturalText && text.text.trim().isEmpty) return;
    if (!naturalText &&
        selected.isEmpty &&
        temperature.text.trim().isEmpty &&
        duration.text.trim().isEmpty) {
      return;
    }
    setState(() {
      if (naturalText) {
        textLoading = true;
      } else {
        loading = true;
      }
      result = '';
    });
    try {
        final endpoint = naturalText ? '/text-symptoms' : '/symptoms';
      final body = naturalText
          ? {'text': text.text.trim()}
          : {
              'symptoms': selected.toList(),
              'clinicalInputs': {
                'feverLevel': feverLevel,
                'temperature': temperature.text.trim(),
                'feverDuration': duration.text.trim(),
                'feverPattern': feverPattern,
              },
            };
      final data = await postJson(endpoint, body);
      await FirebaseFirestore.instance
          .collection(naturalText ? 'text_symptom_checks' : 'symptom_checks')
          .add({
        'userId': FirebaseAuth.instance.currentUser!.uid,
        if (naturalText)
          'text': text.text.trim()
        else
          'symptoms': selected.toList(),
        if (!naturalText)
          'clinicalInputs': {
            'feverLevel': feverLevel,
            'temperature': temperature.text.trim(),
            'feverDuration': duration.text.trim(),
            'feverPattern': feverPattern,
          },
        'result': data,
        'createdAt': FieldValue.serverTimestamp(),
        'updatedAt': FieldValue.serverTimestamp(),
      });
      setState(() => result =
          '${data['predictedDisease'] ?? data['prediction'] ?? 'Needs review'} - ${confidenceText(data['confidence'])}\n${data['explanation'] ?? ''}\n${data['doctorAdvice'] ?? data['suggestedNextStep'] ?? ''}');
      // persist latest prediction for Doctors page
      try {
        final prefs = await SharedPreferences.getInstance();
        final disease = data['predictedDisease'] ?? data['prediction'] ?? 'Unknown';
        final confidence = (data['confidence'] is num)
            ? (data['confidence'] > 1 ? (data['confidence'] as num).round() : ((data['confidence'] as num) * 100).round())
            : 0;
        final payload = {
          'disease': disease,
          'confidence': confidence,
          'riskLevel': data['riskLevel'] ?? 'Moderate',
          'symptoms': selected.toList(),
          'timestamp': DateTime.now().toIso8601String()
        };
        await prefs.setString('latestPrediction', jsonEncode(payload));
      } catch (_) {}
    } catch (err) {
      setState(() => result = friendlyBackendError(err, chatbot: false));
    } finally {
      if (mounted) {
        setState(() {
          loading = false;
          textLoading = false;
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        const SectionTitle(
            title: 'Symptom scanner',
            subtitle:
                'Detailed disease-category intake with Firestore history sync.'),
        GlassCard(
          child: Row(children: [
            Expanded(
              child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text('AI body scan',
                        style: TextStyle(
                            fontSize: 20,
                            fontWeight: FontWeight.w300,
                            color: MediColors.ink)),
                    const SizedBox(height: 6),
                    Text(
                        '${selected.length} active symptom signals selected across fever, digestive, respiratory, exposure, and risk layers.',
                        style: const TextStyle(
                            color: MediColors.muted, height: 1.35)),
                  ]),
            ),
            SizedBox(
              width: 86,
              height: 86,
              child: Stack(alignment: Alignment.center, children: [
                CircularProgressIndicator(
                    value: (selected.length / 10).clamp(0.08, 1),
                    strokeWidth: 8,
                    backgroundColor: MediColors.lead),
                Text(selected.length.toString(),
                    style: const TextStyle(
                        fontSize: 24, fontWeight: FontWeight.w500)),
              ]),
            ),
          ]),
        ),
        GlassCard(
          child: Column(
            children: [
              Row(children: [
                Expanded(
                    child: DropdownButtonFormField(
                        initialValue: feverLevel,
                        items: const ['low', 'moderate', 'high', 'very high']
                            .map((item) => DropdownMenuItem(
                                value: item, child: Text(item)))
                            .toList(),
                        onChanged: (value) =>
                            setState(() => feverLevel = value ?? 'moderate'),
                        decoration:
                            const InputDecoration(labelText: 'Fever level'))),
                const SizedBox(width: 10),
                Expanded(
                    child: DropdownButtonFormField(
                        initialValue: feverPattern,
                        items: const [
                          'continuous',
                          'intermittent',
                          'evening fever',
                          'night fever'
                        ]
                            .map((item) => DropdownMenuItem(
                                value: item, child: Text(item)))
                            .toList(),
                        onChanged: (value) => setState(
                            () => feverPattern = value ?? 'continuous'),
                        decoration:
                            const InputDecoration(labelText: 'Pattern'))),
              ]),
              const SizedBox(height: 10),
              Row(children: [
                Expanded(
                    child: TextField(
                        controller: temperature,
                        decoration:
                            const InputDecoration(labelText: 'Temperature'))),
                const SizedBox(width: 10),
                Expanded(
                    child: TextField(
                        controller: duration,
                        decoration:
                            const InputDecoration(labelText: 'Duration'))),
              ]),
            ],
          ),
        ),
        ...groups.entries.map((entry) => GlassCard(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(entry.key,
                      style: const TextStyle(
                          fontSize: 17, fontWeight: FontWeight.w500)),
                  const SizedBox(height: 10),
                  Wrap(
                      spacing: 8,
                      runSpacing: 8,
                      children: entry.value
                          .map((item) => FilterChip(
                              selected: selected.contains(item),
                              selectedColor: MediColors.primary,
                              checkmarkColor: MediColors.white,
                              side: BorderSide(
                                  color: selected.contains(item)
                                      ? MediColors.primary
                                      : MediColors.lead),
                              label: Text(item),
                              onSelected: (_) => setState(() =>
                                  selected.contains(item)
                                      ? selected.remove(item)
                                      : selected.add(item))))
                          .toList()),
                ],
              ),
            )),
        FilledButton.icon(
            onPressed: loading ? null : () => analyze(),
            icon: loading
                ? const SizedBox.square(
                    dimension: 16,
                    child: CircularProgressIndicator(
                        strokeWidth: 2, color: Colors.white))
                : const Icon(Icons.auto_awesome),
            label: Text(loading ? 'Analyzing...' : 'Predict disease')),
        const SizedBox(height: 12),
        GlassCard(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text('Text symptom checker',
                  style: TextStyle(fontSize: 17, fontWeight: FontWeight.w500)),
              const SizedBox(height: 10),
              TextField(
                  controller: text,
                  minLines: 3,
                  maxLines: 5,
                  onChanged: (_) => setState(() {}),
                  decoration: const InputDecoration(
                      labelText: 'Describe symptoms naturally')),
              const SizedBox(height: 10),
              OutlinedButton.icon(
                  onPressed: text.text.trim().isEmpty || textLoading
                      ? null
                      : () => analyze(naturalText: true),
                  icon: const Icon(Icons.notes_outlined),
                  label: Text(
                      textLoading ? 'Analyzing...' : 'Analyze text symptoms')),
            ],
          ),
        ),
        GlassCard(
            child: Text(
                result.isEmpty
                    ? 'Prediction results and safety guidance will appear here.'
                    : result,
                style: const TextStyle(
                    fontWeight: FontWeight.w400, height: 1.35))),
      ],
    );
  }
}

class DoctorsScreen extends StatelessWidget {
  const DoctorsScreen({super.key});

  static final doctors = [
    {
      'id': 'doctor-1',
      'name': 'Dr. Ananya Rao',
      'specialty': 'Infectious Disease Specialist',
      'location': 'Bengaluru, India',
      'experience': '12 years',
      'phone': '15551234567',
      'rating': 4.9,
      'description': 'Expert in fever diagnosis, dengue, malaria and complex infectious conditions.'
    },
    {
      'id': 'doctor-2',
      'name': 'Dr. Sameer Patel',
      'specialty': 'General Physician',
      'location': 'Mumbai, India',
      'experience': '10 years',
      'phone': '15552345678',
      'rating': 4.8,
      'description': 'Practical clinical guidance for acute symptoms, referrals, and first-line treatment plans.'
    },
    {
      'id': 'doctor-3',
      'name': 'Dr. Meera Sharma',
      'specialty': 'Internal Medicine',
      'location': 'Delhi, India',
      'experience': '14 years',
      'phone': '15553456789',
      'rating': 4.7,
      'description': 'Focused on diagnostic clarity, lab follow-up, and safe outpatient care pathways.'
    },
    {
      'id': 'doctor-4',
      'name': 'Dr. Rohan Iyer',
      'specialty': 'Pediatric & Family Care',
      'location': 'Chennai, India',
      'experience': '9 years',
      'phone': '15554567890',
      'rating': 4.8,
      'description': 'Child-friendly consultation for fever, infection, and family health guidance.'
    }
  ];

  Future<Map<String, dynamic>?> _loadPrediction() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final raw = prefs.getString('latestPrediction');
      if (raw == null) return null;
      return Map<String, dynamic>.from(jsonDecode(raw) as Map);
    } catch (_) {
      return null;
    }
  }

  Future<void> _openWhatsApp(String phone, String message) async {
    final encoded = Uri.encodeComponent(message);
    final url = 'https://wa.me/$phone?text=$encoded';
    final uri = Uri.parse(url);
    if (!await launchUrl(uri, mode: LaunchMode.externalApplication)) {
      throw 'Could not open $url';
    }
  }

  @override
  Widget build(BuildContext context) {
    return FutureBuilder<Map<String, dynamic>?>(
      future: _loadPrediction(),
      builder: (context, snapshot) {
        final prediction = snapshot.data;
        final disease = (prediction?['disease'] ?? 'your condition').toString();
        final confidence = prediction?['confidence']?.toString();
        final summary = confidence != null ? '$disease ($confidence%)' : disease;
        return ListView(
          padding: const EdgeInsets.all(16),
          children: [
            const SectionTitle(
                title: 'Doctor consultation',
                subtitle: 'Choose a clinician and continue via WhatsApp.'),
            GlassCard(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text('MEDISENSE prediction', style: TextStyle(fontSize: 12, color: MediColors.muted)),
                  const SizedBox(height: 8),
                  Text('Prediction: $summary', style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w600)),
                  const SizedBox(height: 8),
                  const Text('This will prefill a WhatsApp message to the doctor with your MEDISENSE result.', style: TextStyle(color: MediColors.muted)),
                ],
              ),
            ),
            const SizedBox(height: 12),
            ...doctors.map((doctor) {
              final name = doctor['name'].toString();
              final description = doctor['description'].toString();
              final phone = doctor['phone'].toString();

              return GlassCard(
                  child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                    Text(name, style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w600)),
                    const SizedBox(height: 6),
                    Text('${doctor['specialty']} · ${doctor['location']} · ${doctor['experience']}', style: const TextStyle(color: MediColors.muted)),
                    const SizedBox(height: 8),
                    Text(description, style: const TextStyle(color: MediColors.muted)),
                    const SizedBox(height: 8),
                    Row(mainAxisAlignment: MainAxisAlignment.end, children: [
                      FilledButton.icon(
                        onPressed: () async {
                          final message = 'Hello ${doctor['name']}, I used MEDISENSE and received a prediction for $disease${confidence != null ? ' with $confidence% confidence' : ''}. I’d like a consultation.';
                          try {
                            await _openWhatsApp(phone, message);
                          } catch (err) {
                            if (!context.mounted) return;
                            ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Could not open WhatsApp: $err')));
                          }
                        },
                        icon: const Icon(Icons.message),
                        label: const Text('WhatsApp consult'),
                      )
                    ])
                  ]),
                );
            })
          ],
        );
      },
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
    final picked = await FilePicker.platform.pickFiles(
        withData: true,
        type: FileType.custom,
        allowedExtensions: ['png', 'jpg', 'jpeg', 'webp', 'pdf']);
    final file = picked?.files.single;
    if (file == null || file.bytes == null) return;
    setState(() {
      loading = true;
      result = 'Uploading report securely...';
    });
    try {
      final user = FirebaseAuth.instance.currentUser!;
      final uploadBody = await uploadToCloudinary(file, kind: 'report');
      final fileType = mimeForFile(file);
      final ocr = await postJson('/ocr-report', {
        'fileUrl': uploadBody['secureUrl'],
        'fileType': fileType,
        'fileName': file.name
      });
      final values = Map<String, dynamic>.from(
          (ocr['extractedValues'] ?? ocr['extracted_data'] ?? {}) as Map);
      if (values.values.every((value) =>
          value == null || value == 'N/A' || value.toString().isEmpty)) {
        throw 'OCR could not read CBC values. Upload a clearer report image or PDF.';
      }
      final analysis = await postJson(
          '/analyze-report-values', {'values': values, 'symptoms': []});
      final reportRef =
          await FirebaseFirestore.instance.collection('medical_reports').add({
        'userId': user.uid,
        'fileUrl': uploadBody['secureUrl'],
        'publicId': uploadBody['publicId'],
        'fileType': fileType,
        'file_name': file.name,
        'extractedText': ocr['extractedText'] ?? ocr['raw_text'] ?? '',
        'extractedValues': values,
        'analysisResult': analysis['summary'] ?? analysis['analysis'] ?? '',
        'riskLevel': analysis['riskLevel'] ?? 'low',
        'flags': analysis['flags'] ?? [],
        for (final marker in reportMarkers)
          marker: toNullableNumber(values[marker]),
        'createdAt': FieldValue.serverTimestamp(),
        'updatedAt': FieldValue.serverTimestamp(),
      });
      await Future.wait(reportMarkers.map((marker) =>
          FirebaseFirestore.instance.collection('report_values').add({
            'userId': user.uid,
            'reportId': reportRef.id,
            'marker': marker,
            'value': toNullableNumber(values[marker]),
            'status': markerStatus(marker, toNullableNumber(values[marker])),
            'createdAt': FieldValue.serverTimestamp(),
            'updatedAt': FieldValue.serverTimestamp(),
          })));
      setState(() => result = formatReportSummary(values, analysis));
    } catch (err) {
      setState(() => result = friendlyBackendError(err, chatbot: false));
    } finally {
      if (mounted) setState(() => loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return ListView(padding: const EdgeInsets.all(16), children: [
      const SectionTitle(
          title: 'Report analyzer',
          subtitle:
              'Cloudinary upload, FastAPI OCR, CBC extraction, and Firestore report history.'),
      GlassCard(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Row(children: [
              DoctorMark(size: 48),
              SizedBox(width: 12),
              Expanded(
                child: Text('Holographic OCR scanner',
                    style:
                        TextStyle(fontSize: 21, fontWeight: FontWeight.w300)),
              ),
            ]),
            const SizedBox(height: 8),
            const Text(
                'PDF and image reports are signed by the web API route so Cloudinary secrets stay off the device.',
                style: TextStyle(color: MediColors.muted, height: 1.35)),
            const SizedBox(height: 14),
            Container(
              height: 118,
              decoration: BoxDecoration(
                border: Border.all(
                    color: MediColors.ghostBlue.withValues(alpha: 0.25)),
                color: MediColors.graphite.withValues(alpha: 0.45),
              ),
              child: const Center(
                child: Icon(Icons.document_scanner_outlined,
                    color: MediColors.text, size: 46),
              ),
            ),
            const SizedBox(height: 14),
            SizedBox(
                width: double.infinity,
                child: FilledButton.icon(
                    onPressed: loading ? null : pickAndUpload,
                    icon: const Icon(Icons.upload_file),
                    label:
                        Text(loading ? 'Analyzing...' : 'Upload and analyze'))),
          ],
        ),
      ),
      GlassCard(
          child: Text(result,
              style:
                  const TextStyle(height: 1.35, fontWeight: FontWeight.w400))),
    ]);
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
      final data = await postJson('/chatbot', {
        'message': text,
        'userId': user.uid,
        'context': healthContext,
        'history': [],
        'healthContext': healthContext
      });
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
      final friendly = friendlyBackendError(err, chatbot: true);
      setState(() => errorMessage = friendly);
      await FirebaseFirestore.instance.collection('notifications').add({
        'userId': user.uid,
        'type': 'chatbot_error',
        'message': friendly,
        'createdAt': FieldValue.serverTimestamp()
      });
    } finally {
      if (mounted) {
        setState(() {
          loading = false;
          pendingMessage = '';
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final userId = FirebaseAuth.instance.currentUser!.uid;
    return Column(children: [
      Expanded(
        child: StreamBuilder<QuerySnapshot<Map<String, dynamic>>>(
          stream: FirebaseFirestore.instance
              .collection('chatbot_messages')
              .where('userId', isEqualTo: userId)
              .snapshots(),
          builder: (context, snapshot) {
            final docs =
                sortedDocs(snapshot.data?.docs ?? []).reversed.toList();
            return ListView(padding: const EdgeInsets.all(16), children: [
              const SectionTitle(
                  title: 'AI chatbot',
                  subtitle:
                      'Provider-ready guidance with local medical fallback.'),
              const GlassCard(
                child: Row(children: [
                  DoctorMark(size: 56),
                  SizedBox(width: 14),
                  Expanded(
                    child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text('Medi AI assistant',
                              style: TextStyle(
                                  fontSize: 20, fontWeight: FontWeight.w300)),
                          SizedBox(height: 6),
                          Text('Floating clinical chat with profile and report context.',
                              style: TextStyle(
                                  color: MediColors.muted, height: 1.35)),
                        ]),
                  ),
                ]),
              ),
              Wrap(
                  spacing: 8,
                  runSpacing: 8,
                  children: quickQuestions
                      .map((question) => ActionChip(
                          label: Text(question),
                          onPressed: loading ? null : () => send(question)))
                      .toList()),
              const SizedBox(height: 12),
              if (errorMessage.isNotEmpty)
                GlassCard(
                    child: Text(errorMessage,
                        style: const TextStyle(
                            color: MediColors.text,
                            fontWeight: FontWeight.w400))),
              if (docs.isEmpty && pendingMessage.isEmpty && !loading)
                const EmptyState(
                    text:
                        'Ask MEDISENSE about symptoms, CBC values, precautions, or when to seek care.'),
              ...docs.expand((doc) => [
                    chatBubble(context,
                        doc.data()['user_message']?.toString() ?? '', true),
                    chatBubble(context,
                        doc.data()['ai_response']?.toString() ?? '', false),
                  ]),
              if (pendingMessage.isNotEmpty)
                chatBubble(context, pendingMessage, true),
              if (loading) typingBubble(),
            ]);
          },
        ),
      ),
      SafeArea(
        top: false,
        child: Padding(
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
                  suffixIcon: controller.text.isEmpty
                      ? null
                      : IconButton(
                          onPressed: () => setState(() => controller.clear()),
                          icon: const Icon(Icons.close)),
                ),
                onChanged: (_) => setState(() {}),
              ),
            ),
            const SizedBox(width: 8),
            IconButton.filled(
                onPressed: loading ? null : () => send(),
                icon: loading
                    ? const SizedBox.square(
                        dimension: 18,
                        child: CircularProgressIndicator(
                            strokeWidth: 2, color: Colors.white))
                    : const Icon(Icons.send)),
          ]),
        ),
      ),
    ]);
  }
}

class HistoryScreen extends StatelessWidget {
  const HistoryScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final userId = FirebaseAuth.instance.currentUser!.uid;
    return StreamBuilder<QuerySnapshot<Map<String, dynamic>>>(
      stream: FirebaseFirestore.instance
          .collection('symptom_checks')
          .where('userId', isEqualTo: userId)
          .snapshots(),
      builder: (context, symptomSnapshot) {
        return StreamBuilder<QuerySnapshot<Map<String, dynamic>>>(
          stream: FirebaseFirestore.instance
              .collection('medical_reports')
              .where('userId', isEqualTo: userId)
              .snapshots(),
          builder: (context, reportSnapshot) {
            return StreamBuilder<QuerySnapshot<Map<String, dynamic>>>(
              stream: FirebaseFirestore.instance
                  .collection('chatbot_messages')
                  .where('userId', isEqualTo: userId)
                  .snapshots(),
              builder: (context, chatSnapshot) {
                final symptoms = sortedDocs(symptomSnapshot.data?.docs ?? []);
                final reports = sortedDocs(reportSnapshot.data?.docs ?? []);
                final chats = sortedDocs(chatSnapshot.data?.docs ?? []);
                return ListView(
                  padding: const EdgeInsets.all(16),
                  children: [
                    const SectionTitle(
                        title: 'Health history',
                        subtitle:
                            'Firestore records shared with the web dashboard.'),
                    DashboardTimeline(
                        title: 'Symptom checks',
                        docs: symptoms,
                        empty: 'No symptom history yet.',
                        builder: (data) =>
                            '${data['result']?['predictedDisease'] ?? data['result']?['prediction'] ?? 'Needs review'} - ${formatDate(data['createdAt'])}'),
                    DashboardTimeline(
                        title: 'Reports',
                        docs: reports,
                        empty: 'No report history yet.',
                        builder: (data) =>
                            '${data['file_name'] ?? 'Report'} - ${data['riskLevel'] ?? 'low'} risk'),
                    DashboardTimeline(
                        title: 'Chatbot',
                        docs: chats,
                        empty: 'No chat history yet.',
                        builder: (data) =>
                            data['user_message']?.toString() ?? 'Chat message'),
                  ],
                );
              },
            );
          },
        );
      },
    );
  }
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
    'phone': TextEditingController(),
    'address': TextEditingController(),
  };
  String message = '';
  bool loading = false;

  @override
  void initState() {
    super.initState();
    load();
  }

  @override
  void dispose() {
    for (final controller in fields.values) {
      controller.dispose();
    }
    super.dispose();
  }

  Future<void> load() async {
    final doc = await FirebaseFirestore.instance
        .collection('users')
        .doc(FirebaseAuth.instance.currentUser!.uid)
        .get();
    final data = doc.data() ?? {};
    for (final entry in fields.entries) {
      final value = data[entry.key];
      entry.value.text =
          value is List ? value.join(', ') : (value?.toString() ?? '');
    }
    if (mounted) setState(() {});
  }

  Future<void> save() async {
    setState(() => loading = true);
    await FirebaseFirestore.instance
        .collection('users')
        .doc(FirebaseAuth.instance.currentUser!.uid)
        .set({
      for (final entry in fields.entries)
        entry.key: ['allergies', 'existingConditions'].contains(entry.key)
            ? entry.value.text
                .split(',')
                .map((item) => item.trim())
                .where((item) => item.isNotEmpty)
                .toList()
            : entry.value.text.trim(),
      'userId': FirebaseAuth.instance.currentUser!.uid,
      'email': FirebaseAuth.instance.currentUser!.email,
      'updatedAt': FieldValue.serverTimestamp(),
    }, SetOptions(merge: true));
    setState(() {
      loading = false;
      message = 'Profile saved and synced to Firestore.';
    });
  }

  Future<void> uploadAvatar() async {
    final picked = await FilePicker.platform.pickFiles(
        withData: true,
        type: FileType.custom,
        allowedExtensions: ['png', 'jpg', 'jpeg', 'webp']);
    final file = picked?.files.single;
    if (file == null || file.bytes == null) return;
    setState(() {
      loading = true;
      message = 'Uploading profile photo...';
    });
    try {
      final uploaded = await uploadToCloudinary(file, kind: 'profile');
      await FirebaseFirestore.instance
          .collection('users')
          .doc(FirebaseAuth.instance.currentUser!.uid)
          .set({
        'profileImage': uploaded['secureUrl'],
        'profileImagePublicId': uploaded['publicId'],
        'updatedAt': FieldValue.serverTimestamp(),
      }, SetOptions(merge: true));
      setState(() => message = 'Profile photo updated.');
    } catch (error) {
      setState(() => message = friendlyBackendError(error, chatbot: false));
    } finally {
      if (mounted) setState(() => loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return ListView(padding: const EdgeInsets.all(16), children: [
      const SectionTitle(
          title: 'Profile',
          subtitle: 'Personalization data shared by web and mobile.'),
      OutlinedButton.icon(
          onPressed: loading ? null : uploadAvatar,
          icon: const Icon(Icons.add_a_photo_outlined),
          label: const Text('Upload profile image')),
      const SizedBox(height: 12),
      ...fields.entries.map((entry) => Padding(
          padding: const EdgeInsets.only(bottom: 10),
          child: TextField(
              controller: entry.value,
              decoration: InputDecoration(labelText: labelFor(entry.key))))),
      FilledButton.icon(
          onPressed: loading ? null : save,
          icon: loading
              ? const SizedBox.square(
                  dimension: 16,
                  child: CircularProgressIndicator(
                      strokeWidth: 2, color: Colors.white))
              : const Icon(Icons.save),
          label: const Text('Save profile')),
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
  bool privacyMode = false;
  String theme = 'light';
  String message = '';
  bool loading = false;

  @override
  void initState() {
    super.initState();
    load();
  }

  Future<void> load() async {
    final doc = await FirebaseFirestore.instance
        .collection('user_settings')
        .doc(FirebaseAuth.instance.currentUser!.uid)
        .get();
    final data = doc.data();
    if (data == null) return;
    setState(() {
      emailNotifications = data['email_notifications'] == true;
      reportAlerts = data['report_alerts'] != false;
      symptomReminders = data['symptom_reminders'] == true;
      privacyMode = data['privacyMode'] == true;
      theme = data['theme']?.toString() ?? 'light';
    });
  }

  Future<void> save() async {
    setState(() => loading = true);
    await FirebaseFirestore.instance
        .collection('user_settings')
        .doc(FirebaseAuth.instance.currentUser!.uid)
        .set({
      'userId': FirebaseAuth.instance.currentUser!.uid,
      'email_notifications': emailNotifications,
      'report_alerts': reportAlerts,
      'symptom_reminders': symptomReminders,
      'privacyMode': privacyMode,
      'theme': theme,
      'updatedAt': FieldValue.serverTimestamp(),
      'createdAt': FieldValue.serverTimestamp(),
    }, SetOptions(merge: true));
    setState(() {
      loading = false;
      message = 'Settings saved.';
    });
  }

  Future<void> resetPassword() async {
    try {
      await FirebaseAuth.instance.sendPasswordResetEmail(
          email: FirebaseAuth.instance.currentUser!.email!);
      setState(() => message = 'Password reset email sent.');
    } catch (error) {
      setState(() => message = friendlyAuthError(error));
    }
  }

  @override
  Widget build(BuildContext context) {
    return ListView(padding: const EdgeInsets.all(16), children: [
      const SectionTitle(
          title: 'Settings',
          subtitle:
              'Synced preferences, security actions, and account controls.'),
      GlassCard(
        child: Column(children: [
          SwitchListTile(
              value: emailNotifications,
              onChanged: (value) => setState(() => emailNotifications = value),
              title: const Text('Email notifications')),
          SwitchListTile(
              value: reportAlerts,
              onChanged: (value) => setState(() => reportAlerts = value),
              title: const Text('Report alerts')),
          SwitchListTile(
              value: symptomReminders,
              onChanged: (value) => setState(() => symptomReminders = value),
              title: const Text('Symptom reminders')),
          SwitchListTile(
              value: privacyMode,
              onChanged: (value) => setState(() => privacyMode = value),
              title: const Text('Privacy mode')),
          DropdownButtonFormField(
              initialValue: theme,
              items: const [
                DropdownMenuItem(
                    value: 'light', child: Text('Command-center dark')),
                DropdownMenuItem(value: 'system', child: Text('System'))
              ],
              onChanged: (value) => setState(() => theme = value ?? 'light'),
              decoration: const InputDecoration(labelText: 'Theme')),
        ]),
      ),
      FilledButton.icon(
          onPressed: loading ? null : save,
          icon: loading
              ? const SizedBox.square(
                  dimension: 16,
                  child: CircularProgressIndicator(
                      strokeWidth: 2, color: Colors.white))
              : const Icon(Icons.save),
          label: const Text('Save settings')),
      OutlinedButton(
          onPressed: resetPassword, child: const Text('Send password reset')),
      OutlinedButton(
          onPressed: () => FirebaseAuth.instance.signOut(),
          child: const Text('Logout')),
      OutlinedButton(
          onPressed: () => setState(() => message =
              'Delete account requires a protected admin deletion endpoint.'),
          child: const Text('Request account deletion')),
      if (message.isNotEmpty) GlassCard(child: Text(message)),
    ]);
  }
}

class PremiumBackground extends StatelessWidget {
  const PremiumBackground({required this.child, super.key});
  final Widget child;

  @override
  Widget build(BuildContext context) {
    return Stack(
      fit: StackFit.expand,
      children: [
        const DecoratedBox(
          decoration: BoxDecoration(
            gradient: LinearGradient(
              colors: [
                MediColors.background,
                MediColors.surface,
                MediColors.background
              ],
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
            ),
          ),
        ),
        const Positioned(
          top: -90,
          right: -80,
          child: _LightField(
              size: 260, colors: [MediColors.primary, MediColors.ghostBlue]),
        ),
        const Positioned(
          bottom: -120,
          left: -90,
          child: _LightField(
              size: 300, colors: [MediColors.ghostBlue, MediColors.primary]),
        ),
        CustomPaint(painter: _NeuralGridPainter()),
        child,
      ],
    );
  }
}

class _LightField extends StatelessWidget {
  const _LightField({required this.size, required this.colors});
  final double size;
  final List<Color> colors;

  @override
  Widget build(BuildContext context) {
    return IgnorePointer(
      child: ImageFiltered(
        imageFilter: ImageFilter.blur(sigmaX: 42, sigmaY: 42),
        child: Container(
          width: size,
          height: size * 0.72,
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(80),
            gradient: LinearGradient(
              colors: [
                colors.first.withValues(alpha: 0.13),
                colors.last.withValues(alpha: 0.06),
                Colors.transparent,
              ],
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
            ),
          ),
        ),
      ),
    );
  }
}

class _NeuralGridPainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = MediColors.ghostBlue.withValues(alpha: 0.05)
      ..strokeWidth = 1;
    const gap = 34.0;
    for (double x = 0; x < size.width; x += gap) {
      canvas.drawLine(Offset(x, 0), Offset(x, size.height), paint);
    }
    for (double y = 0; y < size.height; y += gap) {
      canvas.drawLine(Offset(0, y), Offset(size.width, y), paint);
    }
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}

class DoctorMark extends StatelessWidget {
  const DoctorMark({this.size = 52, super.key});
  final double size;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: size,
      height: size,
      decoration: BoxDecoration(
        color: MediColors.graphite,
        borderRadius: BorderRadius.circular(4),
        border: Border.all(color: MediColors.ghostBlue.withValues(alpha: 0.16)),
      ),
      child: const Icon(Icons.monitor_heart_outlined, color: MediColors.text),
    );
  }
}

class GlassCard extends StatelessWidget {
  const GlassCard(
      {required this.child,
      this.margin = const EdgeInsets.only(bottom: 14),
      this.padding = const EdgeInsets.all(18),
      super.key});
  final Widget child;
  final EdgeInsetsGeometry margin;
  final EdgeInsetsGeometry padding;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      margin: margin,
      child: ClipRRect(
        borderRadius: BorderRadius.circular(28),
        child: BackdropFilter(
          filter: ImageFilter.blur(sigmaX: 22, sigmaY: 22),
          child: Container(
            padding: padding,
            decoration: BoxDecoration(
              color: MediColors.surface.withValues(alpha: 0.82),
              borderRadius: BorderRadius.circular(28),
              border: Border.all(color: MediColors.lead.withValues(alpha: 0.38)),
            ),
            child: child,
          ),
        ),
      ),
    );
  }
}

class SectionTitle extends StatelessWidget {
  const SectionTitle({required this.title, required this.subtitle, super.key});
  final String title;
  final String subtitle;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 14),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text('MEDISENSE',
              style: TextStyle(
                  fontSize: 12,
                  fontWeight: FontWeight.w500,
                  letterSpacing: 1.6,
                  color: MediColors.muted)),
          const SizedBox(height: 4),
          Text(title,
              style: const TextStyle(
                  fontSize: 30,
                  fontWeight: FontWeight.w300,
                  color: MediColors.text)),
          const SizedBox(height: 6),
          Text(subtitle,
              style: const TextStyle(
                  color: MediColors.muted,
                  height: 1.45,
                  fontWeight: FontWeight.w400)),
        ],
      ),
    );
  }
}

class EmptyState extends StatelessWidget {
  const EmptyState({required this.text, super.key});
  final String text;

  @override
  Widget build(BuildContext context) {
    return GlassCard(
        child: Text(text, style: const TextStyle(color: MediColors.muted)));
  }
}

class MetricTile extends StatelessWidget {
  const MetricTile(
      {required this.label,
      required this.value,
      required this.icon,
      required this.color,
      super.key});
  final String label;
  final String value;
  final IconData icon;
  final Color color;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: MediColors.graphite.withValues(alpha: 0.48),
        border: Border.all(color: MediColors.lead.withValues(alpha: 0.35)),
      ),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Icon(icon, color: MediColors.text),
        const Spacer(),
        Text(label,
            style: const TextStyle(
                fontSize: 12,
                color: MediColors.muted,
                fontWeight: FontWeight.w500)),
        const SizedBox(height: 4),
        Text(value,
            maxLines: 2,
            overflow: TextOverflow.ellipsis,
            style: const TextStyle(
                fontSize: 17,
                fontWeight: FontWeight.w500,
                color: MediColors.text)),
      ]),
    );
  }
}

class DashboardTimeline extends StatelessWidget {
  const DashboardTimeline(
      {required this.title,
      required this.docs,
      required this.empty,
      required this.builder,
      super.key});
  final String title;
  final List<QueryDocumentSnapshot<Map<String, dynamic>>> docs;
  final String empty;
  final String Function(Map<String, dynamic>) builder;

  @override
  Widget build(BuildContext context) {
    return GlassCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(title,
              style:
                  const TextStyle(fontSize: 18, fontWeight: FontWeight.w500)),
          const SizedBox(height: 12),
          if (docs.isEmpty)
            Text(empty, style: const TextStyle(color: MediColors.muted)),
          ...docs.take(4).map((doc) => Container(
                width: double.infinity,
                margin: const EdgeInsets.only(bottom: 8),
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                    color: MediColors.graphite.withValues(alpha: 0.48),
                    border: Border.all(
                        color: MediColors.lead.withValues(alpha: 0.35))),
                child: Text(builder(doc.data()),
                    maxLines: 3, overflow: TextOverflow.ellipsis),
              )),
        ],
      ),
    );
  }
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
        color: fromUser
            ? MediColors.primary
            : MediColors.graphite.withValues(alpha: 0.62),
        borderRadius: BorderRadius.circular(fromUser ? 24 : 4),
        border: Border.all(
            color: fromUser
                ? MediColors.primary
                : MediColors.lead.withValues(alpha: 0.35)),
      ),
      child: Text(text,
          style: TextStyle(
              color: fromUser ? MediColors.white : MediColors.muted,
              height: 1.35)),
    ),
  );
}

Widget typingBubble() {
  return Align(
    alignment: Alignment.centerLeft,
    child: Container(
      margin: const EdgeInsets.only(bottom: 10),
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
      decoration: BoxDecoration(
          color: MediColors.graphite.withValues(alpha: 0.62),
          border: Border.all(color: MediColors.lead.withValues(alpha: 0.35))),
      child: const Row(mainAxisSize: MainAxisSize.min, children: [
        SizedBox.square(
            dimension: 18, child: CircularProgressIndicator(strokeWidth: 2)),
        SizedBox(width: 12),
        Text('MEDISENSE is typing...',
            style: TextStyle(color: MediColors.muted))
      ]),
    ),
  );
}

Future<Map<String, dynamic>> postJson(
    String path, Map<String, dynamic> body) async {
  try {
    final response = await http.post(Uri.parse('${apiBaseUrl()}$path'),
        headers: {'Content-Type': 'application/json'}, body: jsonEncode(body));
    final decoded =
        response.body.isEmpty ? <String, dynamic>{} : jsonDecode(response.body);
    final data = decoded is Map<String, dynamic>
        ? decoded
        : <String, dynamic>{'response': decoded.toString()};
    if (response.statusCode >= 300) {
      throw data['detail'] ?? data['error'] ?? 'Request failed';
    }
    return data;
  } catch (error) {
    final text = error.toString();
    if (RegExp(
            'SocketException|Connection refused|XMLHttpRequest|Failed host lookup|NetworkError',
            caseSensitive: false)
        .hasMatch(text)) {
      throw 'The AI assistant is currently offline. Please start the backend service.';
    }
    rethrow;
  }
}

Future<Map<String, dynamic>> uploadToCloudinary(PlatformFile file,
    {required String kind}) async {
  final user = FirebaseAuth.instance.currentUser!;
  final token = await user.getIdToken();
  final upload = http.MultipartRequest(
      'POST', Uri.parse('${webBaseUrl()}/api/cloudinary-upload'));
  upload.headers['Authorization'] = 'Bearer $token';
  upload.fields['kind'] = kind;
  upload.fields['userId'] = user.uid;
  upload.fields['fileType'] = mimeForFile(file);
  upload.files.add(
      http.MultipartFile.fromBytes('file', file.bytes!, filename: file.name));
  final uploaded = await upload.send();
  final uploadText = await uploaded.stream.bytesToString();
  final uploadBody = uploadText.isEmpty
      ? <String, dynamic>{}
      : jsonDecode(uploadText) as Map<String, dynamic>;
  if (uploaded.statusCode >= 300) {
    throw uploadBody['error'] ?? 'Cloudinary upload failed';
  }
  return uploadBody;
}

Future<Map<String, dynamic>> currentChatContext(String userId) async {
  try {
    final profile =
        await FirebaseFirestore.instance.collection('users').doc(userId).get();
    final reportsSnapshot = await FirebaseFirestore.instance
        .collection('medical_reports')
        .where('userId', isEqualTo: userId)
        .limit(10)
        .get();
    final symptomSnapshot = await FirebaseFirestore.instance
        .collection('symptom_checks')
        .where('userId', isEqualTo: userId)
        .limit(10)
        .get();
    final reports = sortedDocs(reportsSnapshot.docs);
    final symptoms = sortedDocs(symptomSnapshot.docs);
    return {
      'profile': profile.data(),
      'latestReport': reports.isEmpty ? null : reports.first.data(),
      'latestSymptomCheck': symptoms.isEmpty ? null : symptoms.first.data(),
    };
  } catch (_) {
    return {};
  }
}

List<QueryDocumentSnapshot<Map<String, dynamic>>> sortedDocs(
    List<QueryDocumentSnapshot<Map<String, dynamic>>> docs) {
  final next = [...docs];
  next.sort((a, b) => readDate(b).compareTo(readDate(a)));
  return next;
}

DateTime readDate(QueryDocumentSnapshot<Map<String, dynamic>> doc) {
  final value = doc.data()['createdAt'];
  return value is Timestamp
      ? value.toDate()
      : DateTime.fromMillisecondsSinceEpoch(0);
}

String formatDate(Object? value) {
  if (value is Timestamp) {
    final date = value.toDate();
    return '${date.year}-${date.month.toString().padLeft(2, '0')}-${date.day.toString().padLeft(2, '0')}';
  }
  return 'saved';
}

int profileCompletion(Map<String, dynamic> profile) {
  if (profile.isEmpty) return 0;
  final fields = [
    'fullName',
    'age',
    'gender',
    'bloodGroup',
    'height',
    'weight',
    'emergencyContact'
  ];
  final complete = fields
      .where((field) =>
          profile[field] != null && profile[field].toString().trim().isNotEmpty)
      .length;
  return ((complete / fields.length) * 100).round();
}

List<FlSpot> chartSpots(
    List<QueryDocumentSnapshot<Map<String, dynamic>>> reports, String key,
    {double divisor = 1}) {
  final reversed = reports.reversed.toList();
  final spots = <FlSpot>[];
  for (var index = 0; index < reversed.length; index += 1) {
    final data = reversed[index].data();
    final extracted = data['extractedValues'];
    final extractedValue = extracted is Map ? extracted[key] : null;
    final value = toNullableNumber(data[key] ?? extractedValue);
    if (value != null) spots.add(FlSpot(index.toDouble(), value / divisor));
  }
  return spots.isEmpty ? [const FlSpot(0, 0)] : spots;
}

double? toNullableNumber(Object? value) {
  if (value == null) return null;
  if (value is num) return value.toDouble();
  final parsed =
      double.tryParse(value.toString().replaceAll(RegExp(r'[^0-9.]'), ''));
  return parsed;
}

String confidenceText(Object? value) {
  final number = toNullableNumber(value) ?? 0;
  final percentage = number <= 1 ? (number * 100).round() : number.round();
  return '$percentage%';
}

String mimeForFile(PlatformFile file) {
  final extension = (file.extension ?? file.name.split('.').last).toLowerCase();
  return switch (extension) {
    'png' => 'image/png',
    'jpg' || 'jpeg' => 'image/jpeg',
    'webp' => 'image/webp',
    'pdf' => 'application/pdf',
    _ => 'application/octet-stream',
  };
}

String markerStatus(String marker, double? value) {
  if (value == null) return 'unknown';
  final ranges = <String, (double, double)>{
    'platelets': (150000, 450000),
    'wbc': (4000, 11000),
    'rbc': (4, 5.9),
    'hemoglobin': (12, 17.5),
    'hematocrit': (36, 52),
    'mcv': (80, 100),
    'mch': (27, 33),
    'mchc': (32, 36),
    'neutrophils': (40, 75),
    'lymphocytes': (20, 45),
    'monocytes': (2, 10),
  };
  final range = ranges[marker];
  if (range == null) return 'unknown';
  if (value < range.$1) return 'low';
  if (value > range.$2) return 'high';
  return 'normal';
}

String friendlyAuthError(Object error) {
  final text = error.toString().replaceFirst('Exception: ', '');
  if (text.contains('network-request-failed')) {
    return 'Network error. Check your connection and try again.';
  }
  if (text.contains('wrong-password') || text.contains('invalid-credential')) {
    return 'Email or password is incorrect.';
  }
  if (text.contains('email-already-in-use')) {
    return 'This email already has a MEDISENSE account.';
  }
  return text;
}

String friendlyBackendError(Object error, {required bool chatbot}) {
  final text = error.toString().replaceFirst('Exception: ', '');
  if (RegExp(
          'offline|backend service|SocketException|Connection refused|XMLHttpRequest|Failed host lookup|NetworkError',
          caseSensitive: false)
      .hasMatch(text)) {
    return 'The AI assistant is currently offline. Please start the backend service.';
  }
  if (chatbot &&
      RegExp('failed to fetch|quota|provider|api key|groq|gemini|openrouter|rate-limit|insufficient',
              caseSensitive: false)
          .hasMatch(text)) {
    return 'MEDISENSE could not answer right now. Please try again in a moment.';
  }
  return text.isEmpty ? 'Request failed. Please try again.' : text;
}

String labelFor(String key) {
  const labels = {
    'fullName': 'Full name',
    'age': 'Age',
    'gender': 'Gender',
    'bloodGroup': 'Blood group',
    'height': 'Height (cm)',
    'weight': 'Weight (kg)',
    'allergies': 'Allergies',
    'existingConditions': 'Medical conditions',
    'emergencyContact': 'Emergency contact',
    'phone': 'Phone',
    'address': 'Address',
  };
  return labels[key] ?? key;
}

String reportValue(Map<String, dynamic> values, String key) {
  final value = values[key];
  if (value == null || value.toString().trim().isEmpty) return 'N/A';
  return value.toString();
}

String formatReportSummary(
    Map<String, dynamic> values, Map<String, dynamic> analysis) {
  const rows = [
    ('Hemoglobin', 'hemoglobin'),
    ('WBC', 'wbc'),
    ('RBC', 'rbc'),
    ('Platelets', 'platelets'),
    ('PCV/Hematocrit', 'hematocrit'),
    ('MCV', 'mcv'),
    ('MCH', 'mch'),
    ('MCHC', 'mchc'),
    ('Neutrophils', 'neutrophils'),
    ('Lymphocytes', 'lymphocytes'),
    ('Monocytes', 'monocytes'),
    ('ANTI DENGUE IgG', 'dengue_igg'),
    ('ANTI DENGUE IgM', 'dengue_igm'),
  ];
  final extracted = rows
      .map((row) => '${row.$1}: ${reportValue(values, row.$2)}')
      .join('\n');
  final summary = analysis['summary'] ?? analysis['analysis'] ?? '';
  return summary.toString().trim().isEmpty
      ? extracted
      : '$extracted\n$summary';
}

const reportMarkers = [
  'platelets',
  'wbc',
  'rbc',
  'hemoglobin',
  'hematocrit',
  'mcv',
  'mch',
  'mchc',
  'neutrophils',
  'lymphocytes',
  'monocytes'
];
