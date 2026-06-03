export type DoctorProfile = {
  id: string;
  name: string;
  specialty: string;
  location: string;
  experience: string;
  phone: string;
  image: string;
  rating: number;
  description: string;
};

export const doctors: DoctorProfile[] = [
  {
    id: "doctor-1",
    name: "Dr. Ananya Rao",
    specialty: "Infectious Disease Specialist",
    location: "Bengaluru, India",
    experience: "12 years experience",
    phone: "15551234567",
    image: "/doctors/doctor-1.jpg",
    rating: 4.9,
    description: "Expert in fever diagnosis, dengue, malaria and complex infectious conditions."
  },
  {
    id: "doctor-2",
    name: "Dr. Sameer Patel",
    specialty: "General Physician",
    location: "Mumbai, India",
    experience: "10 years experience",
    phone: "15552345678",
    image: "/doctors/doctor-2.jpg",
    rating: 4.8,
    description: "Practical clinical guidance for acute symptoms, referrals, and first-line treatment plans."
  },
  {
    id: "doctor-3",
    name: "Dr. Meera Sharma",
    specialty: "Internal Medicine",
    location: "Delhi, India",
    experience: "14 years experience",
    phone: "15553456789",
    image: "/doctors/doctor-3.jpg",
    rating: 4.7,
    description: "Focused on diagnostic clarity, lab follow-up, and safe outpatient care pathways."
  },
  {
    id: "doctor-4",
    name: "Dr. Rohan Iyer",
    specialty: "Pediatric & Family Care",
    location: "Chennai, India",
    experience: "9 years experience",
    phone: "15554567890",
    image: "/doctors/doctor-4.jpg",
    rating: 4.8,
    description: "Child-friendly consultation for fever, infection, and family health guidance."
  }
];
