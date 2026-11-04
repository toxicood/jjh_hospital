/* Prisma seed — creates first admin + clearly-marked SAMPLE content.
 * All seeded doctors/testimonials/services carry isSample = true so the
 * website shows a "Sample — replace via Admin" badge until verified
 * hospital data is entered from the admin dashboard.
 * Run: npx prisma db seed
 */
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const SAMPLE_PASSWORD_NOTE = "Sample data — verify and replace via Admin Dashboard.";

async function main() {
  // ---------- First admin ----------
  const adminEmail = (process.env.ADMIN_EMAIL || "admin@jjh.in").toLowerCase();
  const adminPassword = process.env.ADMIN_PASSWORD || "Admin@1234";
  const existingAdmin = await prisma.admin.findUnique({ where: { email: adminEmail } });
  if (!existingAdmin) {
    await prisma.admin.create({
      data: {
        name: process.env.ADMIN_NAME || "Hospital Admin",
        email: adminEmail,
        passwordHash: await bcrypt.hash(adminPassword, 12),
        role: "SUPER_ADMIN",
      },
    });
    console.log(`Admin created: ${adminEmail}`);
  } else {
    console.log(`Admin already exists: ${adminEmail}`);
  }

  // ---------- Editable site settings (placeholders — update via Admin) ----------
  const settings: Record<string, string> = {
    HOSPITAL_NAME: "Jeevan Jyoti Hospital",
    HOSPITAL_NAME_HI: "जीवन ज्योति हॉस्पिटल",
    TAGLINE: "Care with Compassion",
    TAGLINE_HI: "सेवा के साथ संवेदना",
    ADDRESS:
      "Jeevan Jyoti Hospital, Hisar Road, Sirsa, Haryana – 125055 (placeholder — update in Admin → Site Content)",
    PHONE: "+91 90000 00000 (placeholder)",
    EMERGENCY_PHONE: "+91 90000 00001 (placeholder)",
    EMAIL: "contact@jjh.in (placeholder)",
    WHATSAPP_NUMBER: "919000000000", // digits only, used for wa.me links
    MAP_QUERY: "Jeevan Jyoti Hospital, Sirsa, Haryana",
    OPD_TIMING: "09:00 AM – 08:00 PM (sample — update in Admin)",
    FOOTER_NOTE: "Prices, timings and availability are indicative and subject to hospital policy.",
    HOME_ABOUT:
      "Jeevan Jyoti Hospital, Sirsa is committed to quality healthcare for the residents of Sirsa and nearby areas. This About text is a placeholder — describe your hospital's history, mission and facilities here via the Admin dashboard.",
    HOME_ABOUT_HI: "जीवन ज्योति हॉस्पिटल, सिरसा आपकी स्वस्थ जीवन यात्रा का हर क्षण साथ चलता है। (नमूना विवरण — एडमिन से बदलें)",
    BANNER_NOTICE_HI: "सभी OPD, आपातकालीन सेवाएँ 365 दिन उपलब्ध हैं।",
    DISCLAIMER:
      "Portions of this website currently contain sample/placeholder content (marked with a badge) and will be replaced with verified hospital information by the management.",
    CANCELLATION_POLICY:
      "Sample policy — Appointments can be cancelled up to 2 hours before the scheduled slot via the patient dashboard or by calling the hospital. Emergency cases are always attended irrespective of appointments.",
  };
  for (const [key, value] of Object.entries(settings)) {
    await prisma.setting.upsert({ where: { key }, update: {}, create: { key, value } });
  }

  // ---------- Departments (exact list from the hospital brief) ----------
  const departments = [
    {
      name: "General Medicine",
      nameHi: "जनरल मेडिसिन / सामान्य चिकित्सा",
      slug: "general-medicine",
      icon: "🩺",
      description:
        "OPD consultation, diagnosis and medical management of common and chronic illnesses. (Sample description — edit in Admin.)",
    },
    {
      name: "General Surgery",
      nameHi: "जनरल सर्जरी / सामान्य शल्य चिकित्सा",
      slug: "general-surgery",
      icon: "⚕️",
      description: "Routine and minor surgical procedures. (Sample description — edit in Admin.)",
    },
    {
      name: "Medical Oncology",
      nameHi: "मेडिकल ऑन्कोलॉजी / कैंसर चिकित्सा",
      slug: "medical-oncology",
      icon: "🎗️",
      description: "Cancer screening support and medical oncology consultation. (Sample description — edit in Admin.)",
    },
    {
      name: "Gynecology",
      nameHi: "गायनोकोलॉजी / महिला रोग",
      slug: "gynecology",
      icon: "🌼",
      description: "Women's health, antenatal support and gynecological care. (Sample description — edit in Admin.)",
    },
    {
      name: "Urology",
      nameHi: "यूरोलॉजी / मूत्र रोग",
      slug: "urology",
      icon: "🧬",
      description: "Kidney, urinary tract related consultation and treatment. (Sample description — edit in Admin.)",
    },
    {
      name: "Emergency Services",
      nameHi: "आपातकालीन सेवाएँ",
      slug: "emergency-services",
      icon: "🚑",
      description: "Round-the-clock emergency and trauma response. No appointment needed — walk in or call the helpline.",
      highlightDays: "Open 24×7",
    },
  ];

  const deptMap: Record<string, number> = {};
  let order = 0;
  for (const d of departments) {
    const dep = await prisma.department.upsert({
      where: { slug: d.slug },
      update: {},
      create: { ...d, sortOrder: order++ },
    });
    deptMap[d.slug] = dep.id;
  }

  // ---------- Doctors (SAMPLE placeholders — clearly flagged) ----------
  const doctors = [
    { fullName: "Dr. Sample — Physician 1", qualification: "MBBS (replace via Admin)", specialization: "General Medicine", dep: "general-medicine", days: "1,2,3,4,5" },
    { fullName: "Dr. Sample — Surgeon 1", qualification: "MBBS, MS (replace via Admin)", specialization: "General Surgery", dep: "general-surgery", days: "1,3,5" },
    { fullName: "Dr. Sample — Oncologist 1", qualification: "MBBS, MD (replace via Admin)", specialization: "Medical Oncology", dep: "medical-oncology", days: "2,4,6" },
    { fullName: "Dr. Sample — Gynecologist 1", qualification: "MBBS, DGO (replace via Admin)", specialization: "Gynecology", dep: "gynecology", days: "1,2,4,5" },
    { fullName: "Dr. Sample — Urologist 1", qualification: "MBBS, MCh (replace via Admin)", specialization: "Urology", dep: "urology", days: "3,6" },
    { fullName: "Dr. Sample — Emergency 1", qualification: "MBBS (replace via Admin)", specialization: "Emergency Medicine", dep: "emergency-services", days: "0,1,2,3,4,5,6" },
  ];
  for (const d of doctors) {
    const exists = await prisma.doctor.findFirst({ where: { fullName: d.fullName } });
    if (!exists) {
      await prisma.doctor.create({
        data: {
          fullName: d.fullName,
          qualification: d.qualification,
          specialization: d.specialization,
          departmentId: deptMap[d.dep],
          experienceYears: 0,
          bio: SAMPLE_PASSWORD_NOTE,
          availableDays: d.days,
          isSample: true,
        },
      });
    }
  }

  // ---------- Services / Facilities / Why-us (sample placeholders) ----------
  const services = [
    { title: "OPD Consultation", titleHi: "OPD परामर्श", icon: "🩺", category: "FACILITY", order: 1 },
    { title: "24×7 Emergency", titleHi: "24×7 आपातकालीन सेवा", icon: "🚑", category: "FACILITY", order: 2 },
    { title: "Diagnostics & Laboratory", titleHi: "जाँच एवं प्रयोगशाला", icon: "🔬", category: "FACILITY", order: 3 },
    { title: "Pharmacy", titleHi: "फार्मेसी", icon: "💊", category: "FACILITY", order: 4 },
    { title: "Experienced Doctors", titleHi: "अनुभवी डॉक्टर", icon: "👨‍⚕️", category: "WHY_US", order: 5 },
    { title: "Affordable Care", titleHi: "सस्ती एवं गुणवत्तापूर्ण सेवा", icon: "🤝", category: "WHY_US", order: 6 },
    { title: "Clean & Safe Environment", titleHi: "साफ़-सुथरा वातावरण", icon: "🧼", category: "WHY_US", order: 7 },
    { title: "Easy Online Booking", titleHi: "आसान ऑनलाइन बुकिंग", icon: "📲", category: "WHY_US", order: 8 },
  ];
  for (const s of services) {
    const exists = await prisma.service.findFirst({ where: { title: s.title } });
    if (!exists) {
      await prisma.service.create({
        data: {
          title: s.title,
          titleHi: s.titleHi,
          description: SAMPLE_PASSWORD_NOTE,
          descriptionHi: "नमूना विवरण — एडमिन से बदलें।",
          icon: s.icon,
          category: s.category,
          sortOrder: s.order,
        },
      });
    }
  }

  // ---------- Testimonials (SAMPLE placeholders, not real patients) ----------
  const testimonials = [
    { patientName: "Sample Patient 1 (demo)", city: "Sirsa", message: "Demo testimonial — replace with verified feedback from real patients, with their consent." },
    { patientName: "Sample Patient 2 (demo)", city: "Mandi Dabwali", message: "Demo testimonial — replace with verified feedback from real patients, with their consent." },
  ];
  for (const t of testimonials) {
    const exists = await prisma.testimonial.findFirst({ where: { patientName: t.patientName } });
    if (!exists) await prisma.testimonial.create({ data: { ...t, isSample: true } });
  }

  // ---------- FAQ answers stored as settings (editable) ----------
  const faqs: Record<string, string> = {
    FAQ_1_Q: "How do I book an appointment online?",
    FAQ_1_A: "Go to the Book Appointment page, choose a department, doctor, date and time slot. You will receive an Appointment ID.",
    FAQ_2_Q: "How can I check my appointment status?",
    FAQ_2_A: "Open the Check Appointment Status page and enter your Appointment ID with the registered mobile number.",
    FAQ_3_Q: "Can I cancel or reschedule my appointment?",
    FAQ_3_A: "Yes — from the patient dashboard, subject to the hospital's cancellation policy.",
    FAQ_4_Q: "Is emergency care available 24×7?",
    FAQ_4_A: "Emergency services follow the hospital's official timing (see Contact page). In an emergency, call the hospital directly.",
    FAQ_5_Q: "Is the information on this site verified?",
    FAQ_5_A: "Content marked 'Sample' is placeholder data being replaced by the hospital management. Medical decisions should always involve direct consultation.",
  };
  for (const [key, value] of Object.entries(faqs)) {
    await prisma.setting.upsert({ where: { key }, update: {}, create: { key, value } });
  }

  console.log("Seed completed. Sample content is clearly flagged with isSample = true.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
