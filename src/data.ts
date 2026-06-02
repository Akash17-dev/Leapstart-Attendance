/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { UserProfile } from "./types";

export const INITIAL_USERS: UserProfile[] = [
  // Students
  // Newly added 1st-year students
  {
    id: "riyah",
    name: "Riyah Patel",
    email: "riyah@leapstart.gmail.com",
    role: "student",
    linkedinUrl: "https://www.linkedin.com/in/riyah-patel/",
    pfpUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=Riyah",
    bio: "Enthusiastic beginner focused on web fundamentals and collaborative learning.",
    skills: ["HTML", "CSS", "JavaScript"],
    projects: [],
    specialty: "1st Year Student"
  },
  {
    id: "neel",
    name: "Neel Kumar",
    email: "neel@leapstart.gmail.com",
    role: "student",
    linkedinUrl: "https://www.linkedin.com/in/neel-kumar/",
    pfpUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=Neel",
    bio: "Curious developer learning frontend stacks and version control.",
    skills: ["Git", "React", "TypeScript"],
    projects: [],
    specialty: "1st Year Student"
  },
  {
    id: "tanvi",
    name: "Tanvi Rao",
    email: "tanvi@leapstart.gmail.com",
    role: "student",
    linkedinUrl: "https://www.linkedin.com/in/tanvi-rao/",
    pfpUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=Tanvi",
    bio: "Learner building foundational programming habits and small projects.",
    skills: ["Python", "Flask"],
    projects: [],
    specialty: "1st Year Student"
  },
  {
    id: "aadhira",
    name: "Aadhira S",
    email: "aadhira@leapstart.gmail.com",
    role: "student",
    linkedinUrl: "https://www.linkedin.com/in/aadhira-s-360367395/",
    pfpUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=Aadhira",
    bio: "Experiential student at Leapstart of Tech, passionate about computer vision and automated decision models.",
    skills: ["React", "Python", "Computer Vision", "Tailwind CSS"],
    projects: [
      {
        title: "Defect Detector",
        description: "An automated real-time factory defect vision detection model using OpenCV.",
        tags: ["Python", "OpenCV", "Deep Learning"]
      },
      {
        title: "Tech Portfolio",
        description: "Responsive 3D portfolio showcasing project accomplishments.",
        tags: ["React", "Three.js", "Tailwind"]
      }
    ],
    specialty: "2nd Year Student"
  },
  {
    id: "abhishek",
    name: "Abhishek Singh",
    email: "abhishek@leapstart.gmail.com",
    role: "student",
    linkedinUrl: "https://www.linkedin.com/in/abhishek-singh1570/",
    pfpUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=Abhishek",
    bio: "Emerging Data Scientist specializing in neural networks and backend scalability systems at LeapStart.",
    skills: ["Data Analysis", "Node.js", "Neural Networks", "SQL"],
    projects: [
      {
        title: "Predictive Analytics Engine",
        description: "Customer churn predictor running on custom multilayer perceptron logs.",
        tags: ["Python", "TensorFlow", "Pandas"]
      }
    ],
    specialty: "2nd Year Student"
  },
  {
    id: "akash",
    name: "Akash Aakula",
    email: "akash@leapstart.gmail.com",
    role: "student",
    linkedinUrl: "https://www.linkedin.com/in/akash-aakula-584002397/",
    pfpUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=Akash",
    bio: "Full Stack Engineer-in-training at LeapStart School of Tech. Passionate about interactive terminal environments.",
    skills: ["HTML/CSS", "JavaScript", "Express.js", "React"],
    projects: [
      {
        title: "Live Classroom Lab",
        description: "Real-time terminal simulator matching remote shell access setups.",
        tags: ["Node.js", "WebSockets", "Xterm.js"]
      }
    ],
    specialty: "2nd Year Student"
  },
  {
    id: "ashwith",
    name: "Ashwith Thatipally",
    email: "ashwith@leapstart.gmail.com",
    role: "student",
    linkedinUrl: "https://www.linkedin.com/in/ashwith-thatipally-490690390/",
    pfpUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=Ashwith",
    bio: "Aspiring software dev focused on UI/UX optimization frameworks and automated workflow pipes.",
    skills: ["Tailwind CSS", "React Hooks", "Figma", "Redux"],
    projects: [
      {
        title: "Agile Taskboard",
        description: "A drag-and-drop workflow visualizer for educational teams.",
        tags: ["React", "Framer Motion", "UUID"]
      }
    ],
    specialty: "2nd Year Student"
  },
  {
    id: "assad",
    name: "Assad Abuubaida",
    email: "assad@leapstart.gmail.com",
    role: "student",
    linkedinUrl: "https://www.linkedin.com/in/abuubaida-assad-359ab8396/",
    pfpUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=Assad",
    bio: "Infrastructure enthusiast practicing Linux automation and container deployments in experimental environments.",
    skills: ["Linux Admin", "Docker Orchestration", "Python Automation", "Bash Scripting"],
    projects: [
      {
        title: "AutoDeploy Script suite",
        description: "Automated standard sandbox provisioning using relative paths and isolated shells.",
        tags: ["Bash", "Linux", "cron"]
      }
    ],
    specialty: "2nd Year Student"
  },
  {
    id: "bashamoni",
    name: "Bashamoni Shiva kumar",
    email: "bashamoni@leapstart.gmail.com",
    role: "student",
    linkedinUrl: "https://www.linkedin.com/in/bashamoni-shiva-kumar-6a08bb390/",
    pfpUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=Shiva",
    bio: "Passionate AI model builder working with deep learning datasets and neural networks at LeapStart.",
    skills: ["NLP Model Tuner", "Python NumPy", "SQL Data Pipes", "Keras"],
    projects: [
      {
        title: "Review Classifier",
        description: "Bespoke text sentiment categorization tool optimized for low system latency.",
        tags: ["Python", "Keras", "TensorFlow"]
      }
    ],
    specialty: "2nd Year Student"
  },
  {
    id: "kellampalli",
    name: "Kellampalli Saathvik",
    email: "kellampalli@leapstart.gmail.com",
    role: "student",
    linkedinUrl: "https://www.linkedin.com/in/kellampalli-saathvik/",
    pfpUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=Saathvik",
    bio: "Computer Science developer focused on structured databases, system architecture and server optimization.",
    skills: ["PostgreSQL", "Next.js", "TypeScript Server", "GraphQL"],
    projects: [
      {
        title: "DataHub Central",
        description: "Normalized system backend logging user coordinates and attendance tokens safely.",
        tags: ["GraphQL", "Database Schema", "CJS Node"]
      }
    ],
    specialty: "2nd Year Student"
  },
  {
    id: "syed",
    name: "Syed Hanzala Abrar",
    email: "syed@leapstart.gmail.com",
    role: "student",
    linkedinUrl: "https://www.linkedin.com/in/syed-hanzala-abrar-68b29b395/",
    pfpUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=Syed",
    bio: "Front-end enthusiast exploring complex reactive architectures and dynamic layouts under modern browsers.",
    skills: ["Vite", "JavaScript ES6", "CSS Variables", "Responsive Design"],
    projects: [
      {
        title: "Leapstart Portal UI",
        description: "High fidelity student hub UI design centering dark-mode styling variables.",
        tags: ["Vite", "Tailwind Theme", "Motion UI"]
      }
    ],
    specialty: "2nd Year Student"
  },
  {
    id: "jaswanth",
    name: "Jaswanth Santhosh gorlamandala",
    email: "jaswanth@leapstart.gmail.com",
    role: "student",
    linkedinUrl: "https://www.linkedin.com/in/jaswanth-santhosh-gorlamandala-720361395/",
    pfpUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=Jaswanth",
    bio: "Experimental technologist tracking algorithmic runtime speeds and database indexes at LeapStart School.",
    skills: ["Algorithms", "Python Stats", "MySQL Optimizing", "React Hooks"],
    projects: [
      {
        title: "Sort Speed Visualizer",
        description: "A gorgeous react grid showcasing comparison limits of sorting graphs.",
        tags: ["React", "TypeScript", "Bespoke CSS"]
      }
    ],
    specialty: "2nd Year Student"
  },
  {
    id: "eswar",
    name: "EswarSaketh Maturi",
    email: "eswar@leapstart.gmail.com",
    role: "student",
    linkedinUrl: "https://www.linkedin.com/in/eswarsaketh-maturi-023626395/",
    pfpUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=Eswar",
    bio: "Aspiring machine learning researcher building and evaluating structured regression models.",
    skills: ["Data Scavenging", "Pandas Datasets", "Matplotlib Layouts", "C++"],
    projects: [
      {
        title: "Research Hub",
        description: "Automatic document meta reference scraper using Python scripts.",
        tags: ["Python Scraper", "Research Parse", "Pandas"]
      }
    ],
    specialty: "2nd Year Student"
  },
  {
    id: "faizaan",
    name: "Mohammed Faizaan",
    email: "faizaan@leapstart.gmail.com",
    role: "student",
    linkedinUrl: "https://www.linkedin.com/in/mohammed-faizaan-943305395/",
    pfpUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=Faizaan",
    bio: "Meticulous coder with focus on asynchronous node threads and REST API proxies.",
    skills: ["RESTful Routing", "Node JS Threading", "NoSQL Filesystem", "Jest Tests"],
    projects: [
      {
        title: "Proxy API Engine",
        description: "Lightweight routing middle layer proxying server queries without exposing secrets.",
        tags: ["Express.js", "Proxy Controller", "JSON Web Token"]
      }
    ],
    specialty: "2nd Year Student"
  },
  {
    id: "hyder",
    name: "Mohammed Hyder Shareef",
    email: "hyder@leapstart.gmail.com",
    role: "student",
    linkedinUrl: "https://www.linkedin.com/in/mohammed-hyder-shareef-61116a361/",
    pfpUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=Hyder",
    bio: "Passionate coder exploring AI chat assistants and knowledge bases using retrieval grounding models.",
    skills: ["GenAI Integration", "Vite Server", "MongoDB Store", "Tailwind Theme"],
    projects: [
      {
        title: "Insight Bot",
        description: "A chat assistant optimized for school course curriculum grounding contexts.",
        tags: ["@google/genai", "Vite Plugin", "Tailwind UI"]
      }
    ],
    specialty: "2nd Year Student"
  },
  {
    id: "brahmani",
    name: "Ponnam Brahmani",
    email: "brahmani@leapstart.gmail.com",
    role: "student",
    linkedinUrl: "https://www.linkedin.com/in/ponnam-brahmani-341395395/",
    pfpUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=Brahmani",
    bio: "Pragmatic software engineering student seeking highly user-centered frontend products and layouts.",
    skills: ["React Flow", "Tailwind CSS Layouts", "Aesthetic Typography", "Firebase Auth"],
    projects: [
      {
        title: "Event Manager UI",
        description: "Dynamic calendar interface using modern grid layouts and custom date markers.",
        tags: ["React Hooks", "Grids", "Shadow Cards"]
      }
    ],
    specialty: "2nd Year Student"
  },
  {
    id: "humera",
    name: "Humera Thabassum Shaik",
    email: "humera@leapstart.gmail.com",
    role: "student",
    linkedinUrl: "https://www.linkedin.com/in/humera-thabassum-shaik-7551b9385/",
    pfpUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=Humera",
    bio: "Frontend engineer focused on accessible layouts, color hierarchy, and animated micro-interactions.",
    skills: ["Framer Motion", "WCAG Color Contrast", "Inter Font Pairing", "Vite Build"],
    projects: [
      {
        title: "Accessible Calendar",
        description: "Fully screen-readable student schedule tracking dashboard featuring high contrast modes.",
        tags: ["React-a11y", "Tailwind Contrast", "Icons"]
      }
    ],
    specialty: "2nd Year Student"
  },

  // Mentors
  {
    id: "suhas",
    name: "Suhas Choppala",
    email: "suhas@leapstart.gmail.com",
    role: "mentor",
    linkedinUrl: "https://www.linkedin.com/in/suhas-choppala-9321b8218/",
    pfpUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=S01_Suhas",
    bio: "Suhas Choppala. Professional Full Stack Mentor at LeapStart School of Tech. Teaches end-to-end full stack web engineering (React, NodeJS, Express, State management, TS architectures).",
    skills: ["React 19+", "Express JS Server", "ES Modules Bundle", "UI Core Systems", "API Design", "Vite Setup"],
    projects: [
      {
        title: "Full Stack Lab Framework",
        description: "The core blueprint repository used to bootstrap secure sandbox full stack nodes.",
        tags: ["React", "Express", "Vite"]
      }
    ],
    specialty: "Full Stack Engineering Mentor"
  },
  {
    id: "goli",
    name: "Goli Venu Gopal",
    email: "goli@leapstart.gmail.com",
    role: "mentor",
    linkedinUrl: "https://www.linkedin.com/in/goli-venu-gopal-72794621/",
    pfpUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=M02_Goli",
    bio: "Goli Venu Gopal. DB and Backend APIs Expert at LeapStart. Specialist in database query indexing, SQL/NoSQL systems, normalization, security rules, and server-side logic.",
    skills: ["Database Security", "MySQL Indexing", "PostgreSQL Clusters", "API Gateway Scaling", "CJS Server Node"],
    projects: [
      {
        title: "LeapStart Attendance Engine v1",
        description: "A highly resilient student data caching engine protecting individual student P2P lounges.",
        tags: ["NoSQL DB", "Index Optimizations", "JSON State"]
      }
    ],
    specialty: "Database & Backend API Mentor"
  },
  {
    id: "manoj",
    name: "Manoj Karajada",
    email: "manoj@leapstart.gmail.com",
    role: "mentor",
    linkedinUrl: "https://www.linkedin.com/in/manoj-kumar-karajada/",
    pfpUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=M03_Manoj",
    bio: "Manoj Karajada. Dedicated Linux and Cloud Systems Guru at LeapStart. Expert in container runtimes, deployment architectures, system commands, automation files, and deployment security.",
    skills: ["Enterprise Linux", "Shell Cryptography", "Container Security", "cron logs", "Docker Environments"],
    projects: [
      {
        title: "Sandboxed Terminal Kernel",
        description: "Isolated virtual execution terminals running shell directives and safe validation tasks.",
        tags: ["CJS Kernel", "Linux automation", "Bash Engine"]
      }
    ],
    specialty: "Linux & System Architecture Mentor"
  },

  // Admins
  {
    id: "saikrishna",
    name: "SAIKRISHNA JAVVAJI",
    email: "saikrishna@leapstart.gmail.com",
    role: "admin",
    linkedinUrl: "https://www.linkedin.com/in/saikrishnajavvaji/",
    pfpUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=A01_Sai",
    bio: "SAIKRISHNA JAVVAJI. Founder of LeapStart School of Technology. Empowering future tech leaders through experiential engineering and direct mentor connections.",
    skills: ["Visionary Leadership", "EdTech Innovation", "Experiential Pedagogy", "Strategic Scaling"],
    projects: [
      {
        title: "LeapStart School Tech Paradigm",
        description: "The groundbreaking system scaling industry-led professional training labs across regions.",
        tags: ["Branding", "Experiential Framework", "Scale"]
      }
    ],
    specialty: "Founder & Chief Executive"
  },
  {
    id: "manikanta",
    name: "Manikanta Mothukuri",
    email: "manikanta@leapstart.gmail.com",
    role: "admin",
    linkedinUrl: "https://www.linkedin.com/in/manikanta-mothukuri/",
    pfpUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=A02_Mani",
    bio: "Manikanta Mothukuri. Admin & Operational Lead at LeapStart. Directs technical operations, student onboarding pipelines, and system configuration.",
    skills: ["Logistical Operations", "Student Pipelines", "Technical Onboarding", "AWS Cloud Management"],
    projects: [
      {
        title: "Operational Student CRM",
        description: "Custom internal record organizer detailing professional student progress trackers.",
        tags: ["Node System", "CRM", "Logs"]
      }
    ],
    specialty: "Operations Director & Admin"
  },
  {
    id: "yuktha",
    name: "Yuktha Pemmireddy",
    email: "yuktha@leapstart.gmail.com",
    role: "admin",
    linkedinUrl: "https://www.linkedin.com/in/yuktha-pemmireddy-0321a3283/",
    pfpUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=A03_Yuktha",
    bio: "Yuktha Pemmireddy. HR Manager at LeapStart School of Technology. Directs staffing, student retention, counselor sessions, and mentor attendance tracking.",
    skills: ["HR Staff Onboarding", "Student Relations", "Conflict Management", "Organizational Policies"],
    projects: [
      {
        title: "Staff and Mentor Retention Index",
        description: "Analytics system measuring staff engagement and daily experiential teaching hours.",
        tags: ["HR Analytics", "Retainer Systems", "Reports"]
      }
    ],
    specialty: "Human Resources (HR) Director"
  }
];

export const INITIAL_LEAVES = [
  {
    id: "lv-1",
    userId: "aadhira",
    startDate: "2026-06-05",
    endDate: "2026-06-06",
    reason: "Attending Smart Vision Hacks 2026 Hackathon presentation.",
    status: "approved",
    appliedOn: "2026-06-01",
    approvedBy: "suhas",
    remarks: "Good luck with the Computer Vision demo!"
  },
  {
    id: "lv-2",
    userId: "abhishek",
    startDate: "2026-06-10",
    endDate: "2026-06-11",
    reason: "Neural network training cloud servers deployment maintenance standby.",
    status: "pending",
    appliedOn: "2026-06-02"
  }
];

export const MOCK_ATTENDANCE = [
  { userId: "aadhira", status: "present", checkInTime: "17:53:05" },
  { userId: "abhishek", status: "present", checkInTime: "17:53:05" },
  { userId: "akash", status: "present", checkInTime: "17:53:05" },
  { userId: "ashwith", status: "present", checkInTime: "17:53:05" },
  { userId: "assad", status: "present", checkInTime: "17:53:05" },
  { userId: "bashamoni", status: "absent" },
  { userId: "kellampalli", status: "present", checkInTime: "17:53:05" },
  { userId: "syed", status: "present", checkInTime: "17:53:05" },
  { userId: "jaswanth", status: "present", checkInTime: "17:53:05" },
  { userId: "eswar", status: "present", checkInTime: "17:53:05" },
  { userId: "faizaan", status: "absent" },
  { userId: "hyder", status: "present", checkInTime: "17:53:05" },
  { userId: "brahmani", status: "present", checkInTime: "17:53:05" },
  { userId: "humera", status: "present", checkInTime: "17:53:05" },
  { userId: "suhas", status: "present", checkInTime: "17:53:05" },
  { userId: "goli", status: "present", checkInTime: "17:53:05" },
  { userId: "manoj", status: "present", checkInTime: "17:53:05" },
  { userId: "saikrishna", status: "present", checkInTime: "17:53:05" },
  { userId: "manikanta", status: "present", checkInTime: "17:53:05" },
  { userId: "yuktha", status: "present", checkInTime: "17:53:05" }
];
