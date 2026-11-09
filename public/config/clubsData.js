// Master Dataset of 30 Official College Clubs for ClubSphere
// Verified from the official College Student Handbook

const categoryFilters = [
  "All Clubs",
  "Social & Community",
  "Music & Performing Arts",
  "Dance & Cultural Activities",
  "Technical & Innovation",
  "Literary & Knowledge",
  "Leadership & Entrepreneurship",
  "Sports & Personal Development",
  "Environment & Social Welfare"
];

const clubs30 = [
  {
    "name": "Tech Music",
    "code": "TM",
    "category": "Music & Performing Arts",
    "tagline": "Celebrating acoustic, western, classical music and campus vocal performances.",
    "description": "Tech Music is the premier music association dedicated to nurturing instrumentalists, vocalists, acoustic bands, and sound engineers. Students organize live campus concerts, acoustic unplugged sessions, and inter-collegiate music competitions.",
    "objectives": [
      "Music performances across campus festivals and annual cultural nights",
      "Instrumental practice sessions covering acoustic, rhythm, and electric guitars",
      "Vocal training and harmony workshops for solo and choir vocalists",
      "Campus concerts, unplugged acoustic jam sessions, and band competitions"
    ],
    "facultyAdvisors": [
      {
        "name": "Dr. S.P. Suresh Kumar",
        "department": "English"
      },
      {
        "name": "Dr. A.S. Prasanth",
        "department": "Mechanical"
      },
      {
        "name": "Dr. N. Archana",
        "department": "EEE"
      }
    ],
    "facultyAdvisor": {
      "name": "Dr. S.P. Suresh Kumar",
      "designation": "Faculty Advisor",
      "department": "English"
    },
    "recruitmentStatus": null,
    "banner": "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=800&q=80",
    "foundedYear": 2010
  },
  {
    "name": "Tamil Mandram",
    "code": "TMN",
    "category": "Dance & Cultural Activities",
    "tagline": "Preserving linguistic heritage, Tamil literature, and cultural expressions.",
    "description": "Tamil Mandram provides a vibrant platform for students to celebrate Tamil literature, classical oratory, folk arts, and cultural traditions through state-level cultural events and literary forums.",
    "objectives": [
      "Tamil literary programmes and Muthamizh Vizha celebrations",
      "Oratory competitions, Kaviarangam (poetry recitals), and Pattimandram (debates)",
      "Traditional cultural events celebrating folk heritage, arts, and traditions",
      "Tamil language activities, essay writing, and publication of student literature"
    ],
    "facultyAdvisors": [
      {
        "name": "Dr. R. Venkateswari",
        "department": "ECE"
      },
      {
        "name": "Dr. V.M. Murugesan",
        "department": "Automobile"
      }
    ],
    "facultyAdvisor": {
      "name": "Dr. R. Venkateswari",
      "designation": "Faculty Advisor",
      "department": "ECE"
    },
    "recruitmentStatus": null,
    "banner": "https://images.unsplash.com/photo-1788448351519-2734da0d1c8f?auto=format&fit=crop&w=800&q=80",
    "foundedYear": 2005
  },
  {
    "name": "Dramatics Club",
    "code": "DC",
    "category": "Music & Performing Arts",
    "tagline": "Bringing stories to life through theater, street plays, and stagecraft.",
    "description": "The Dramatics Club produces theatrical plays, mime, comedy sketches, and thought-provoking street theatre addressing contemporary societal themes while coaching students in dialogue delivery and stage presence.",
    "objectives": [
      "Stage performances and annual collegiate theatrical productions",
      "Street plays (Nukkad Natak) addressing contemporary societal themes",
      "Acting workshops, dialogue delivery, and stage presence training",
      "Scriptwriting, stagecraft, theatre lighting, and audio management"
    ],
    "facultyAdvisors": [
      {
        "name": "Dr. S. Udhayakumar",
        "department": "Mechanical"
      },
      {
        "name": "Dr. Nirmala Varghese",
        "department": "AFD"
      },
      {
        "name": "Dr. M.P. Bharathi Mohan",
        "department": "Automobile"
      }
    ],
    "facultyAdvisor": {
      "name": "Dr. S. Udhayakumar",
      "designation": "Faculty Advisor",
      "department": "Mechanical"
    },
    "recruitmentStatus": null,
    "banner": "https://images.unsplash.com/photo-1507676184212-d03ab07a01bf?auto=format&fit=crop&w=800&q=80",
    "foundedYear": 2008
  },
  {
    "name": "Fine Arts Club",
    "code": "FAC",
    "category": "Dance & Cultural Activities",
    "tagline": "Fostering visual arts, sketching, oil painting, and creative design.",
    "description": "Fine Arts Club unites painters, sculptors, and digital illustrators across campus. The club manages exhibition galleries, live canvas painting sessions, and campus art installations.",
    "objectives": [
      "Annual campus Art Gallery exhibitions and student showcases",
      "Workshops on oil painting, watercolours, charcoal sketching, and calligraphy",
      "Designing campus murals, festival backdrops, and creative branding",
      "Art competitions in pencil sketching, digital design, and clay sculpting"
    ],
    "facultyAdvisors": [
      {
        "name": "Dr. R. Prathiba Devi",
        "department": "AFD"
      },
      {
        "name": "Ms. K. Parisa Begum",
        "department": "AM & CS"
      }
    ],
    "facultyAdvisor": {
      "name": "Dr. R. Prathiba Devi",
      "designation": "Faculty Advisor",
      "department": "AFD"
    },
    "recruitmentStatus": null,
    "banner": "https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&w=800&q=80",
    "foundedYear": 2007
  },
  {
    "name": "CAP & Nature Club",
    "code": "CNC",
    "category": "Environment & Social Welfare",
    "tagline": "Dedicated to wildlife preservation, campus biodiversity, and eco-conservation.",
    "description": "Community Action Project & Nature Club leads ecological conservation, botanical documentation, bird-watching nature trails, and environmental sustainability initiatives across campus.",
    "objectives": [
      "Tree plantation drives and campus botanical greening initiatives",
      "Environmental awareness campaigns, plastic-reduction, and sustainability projects",
      "Nature activities including wildlife tracking, trekking, and bird-watching trails",
      "Conservation programmes documenting campus flora and biodiversity preservation"
    ],
    "facultyAdvisors": [
      {
        "name": "Dr. J. Hema",
        "department": "Biotech"
      },
      {
        "name": "Dr. D. Maruthamani",
        "department": "Chemistry"
      }
    ],
    "facultyAdvisor": {
      "name": "Dr. J. Hema",
      "designation": "Faculty Advisor",
      "department": "Biotech"
    },
    "recruitmentStatus": null,
    "banner": "https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?auto=format&fit=crop&w=800&q=80",
    "foundedYear": 2006
  },
  {
    "name": "English Literary Society",
    "code": "ELS",
    "category": "Literary & Knowledge",
    "tagline": "Mastering eloquence, parliamentary debate, creative writing, and literary review.",
    "description": "English Literary Society is the focal point for lovers of English language, competitive debate, poetry, elocution, and literary publications, hosting inter-collegiate literary summits.",
    "objectives": [
      "Parliamentary debating tournaments and Model United Nations (MUN)",
      "Creative writing contests, poetry slams, and literary book readings",
      "Publishing student literary anthologies and editorial critiques",
      "Weekly vocabulary, public speaking, and communicative rhetoric sessions"
    ],
    "facultyAdvisors": [
      {
        "name": "Dr. S.P. Suresh Kumar",
        "department": "English"
      }
    ],
    "facultyAdvisor": {
      "name": "Dr. S.P. Suresh Kumar",
      "designation": "Faculty Advisor",
      "department": "English"
    },
    "recruitmentStatus": null,
    "banner": "https://images.unsplash.com/photo-1457369804613-52c61a468e7d?auto=format&fit=crop&w=800&q=80",
    "foundedYear": 2003
  },
  {
    "name": "Youth Red Cross Society",
    "code": "YRC",
    "category": "Social & Community",
    "tagline": "Serving humanity with voluntary disaster relief, health camps, and first aid.",
    "description": "Youth Red Cross empowers youth to provide life-saving first-aid assistance, organize regular voluntary blood donation camps, and lead emergency disaster-relief support operations.",
    "objectives": [
      "Blood donation camps organized regularly with regional medical centres",
      "First-aid awareness and certified emergency CPR training for students",
      "Community service, health checkup camps, and rural welfare initiatives",
      "Disaster relief volunteering, humanitarian assistance, and safety drills"
    ],
    "facultyAdvisors": [
      {
        "name": "Dr. J.R. Sharmila",
        "department": "Chemistry"
      },
      {
        "name": "Dr. M. Murugananthan",
        "department": "Chemistry"
      },
      {
        "name": "Dr. M. Megala",
        "department": "AM & CS"
      }
    ],
    "facultyAdvisor": {
      "name": "Dr. J.R. Sharmila",
      "designation": "Faculty Advisor",
      "department": "Chemistry"
    },
    "recruitmentStatus": null,
    "banner": "https://images.unsplash.com/photo-1536856136534-bb679c52a9aa?auto=format&fit=crop&w=800&q=80",
    "foundedYear": 1999
  },
  {
    "name": "Martial Arts Club",
    "code": "MAC",
    "category": "Sports & Personal Development",
    "tagline": "Building physical discipline, mental resilience, and self-defense prowess.",
    "description": "Martial Arts Club trains students in traditional martial arts, self-defense techniques, karate, and taekwondo, enhancing student fitness, situational awareness, and confidence.",
    "objectives": [
      "Regular belt grading training sessions in Karate and Taekwondo",
      "Campus women self-defense workshops and situational safety bootcamps",
      "Conditioning, agility drills, and mental focus through martial disciplines",
      "Representing the college in state and national martial arts tournaments"
    ],
    "facultyAdvisors": [
      {
        "name": "Dr. N. Ilayaraja",
        "department": "CA"
      },
      {
        "name": "Dr. J. Narayanasamy",
        "department": "Maths"
      }
    ],
    "facultyAdvisor": {
      "name": "Dr. N. Ilayaraja",
      "designation": "Faculty Advisor",
      "department": "CA"
    },
    "recruitmentStatus": null,
    "banner": "https://images.unsplash.com/photo-1555597673-b21d5c935865?auto=format&fit=crop&w=800&q=80",
    "foundedYear": 2011
  },
  {
    "name": "Rotaract Club",
    "code": "RC",
    "category": "Social & Community",
    "tagline": "Fellowship through service, youth leadership, and uplifting communities.",
    "description": "Rotaract Club is an international youth service movement empowering students through meaningful community impact projects, education outreach, tree plantations, and youth leadership forums.",
    "objectives": [
      "Community development initiatives and village welfare camps",
      "Youth leadership and professional development conferences",
      "Educational sponsorship and textbook distribution for schools",
      "Environmental conservation and cleanliness drives"
    ],
    "facultyAdvisors": [
      {
        "name": "Dr. S. Poomagal",
        "department": "AM & CS"
      },
      {
        "name": "Dr. J. Niresh",
        "department": "Automobile"
      }
    ],
    "facultyAdvisor": {
      "name": "Dr. S. Poomagal",
      "designation": "Faculty Advisor",
      "department": "AM & CS"
    },
    "recruitmentStatus": null,
    "banner": "https://images.unsplash.com/photo-1559027615-cd4628902d4a?auto=format&fit=crop&w=800&q=80",
    "foundedYear": 1988
  },
  {
    "name": "Entrepreneurs Club",
    "code": "EC",
    "category": "Leadership & Entrepreneurship",
    "tagline": "Transforming innovative ideas into viable startups and sustainable enterprises.",
    "description": "Entrepreneurs Club fosters entrepreneurial thinking, helping students conceptualize, pitch, and scale business models with guidance from alumni founders and venture mentors.",
    "objectives": [
      "Annual startup pitching summits with angel investors and founders",
      "Workshops on business model canvases, MVP building, and equity financing",
      "Incubation mentorship support for student-founded technological startups",
      "Fireside chats with industry pioneers and venture capitalists"
    ],
    "facultyAdvisors": [
      {
        "name": "Dr. K. Suresh Kumar",
        "department": "Humanities"
      },
      {
        "name": "Dr. C. Shanmugam",
        "department": "Mechanical"
      }
    ],
    "facultyAdvisor": {
      "name": "Dr. K. Suresh Kumar",
      "designation": "Faculty Advisor",
      "department": "Humanities"
    },
    "recruitmentStatus": null,
    "banner": "https://images.unsplash.com/photo-1556761175-5973dc0f32e7?auto=format&fit=crop&w=800&q=80",
    "foundedYear": 2009
  },
  {
    "name": "Astronomy Club",
    "code": "AC",
    "category": "Technical & Innovation",
    "tagline": "Exploring celestial wonders, astrophysics, planetary sciences, and stargazing.",
    "description": "Astronomy Club brings together space enthusiasts for night-sky telescope observations, planetary tracking, astrophotography workshops, and astrophysics guest seminars.",
    "objectives": [
      "Night-sky stargazing sessions with optical and computerized telescopes",
      "Astrophotography workshops capturing lunar craters, nebulae, and constellations",
      "Seminars on cosmology, dark matter, and space exploration missions",
      "Observing astronomical occurrences such as eclipses, meteor showers, and planetary transits"
    ],
    "facultyAdvisors": [
      {
        "name": "Dr. S. Prasanna",
        "department": "Physics"
      },
      {
        "name": "Dr. C. Sudarshan",
        "department": "Applied Science"
      }
    ],
    "facultyAdvisor": {
      "name": "Dr. S. Prasanna",
      "designation": "Faculty Advisor",
      "department": "Physics"
    },
    "recruitmentStatus": null,
    "banner": "https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?auto=format&fit=crop&w=800&q=80",
    "foundedYear": 2012
  },
  {
    "name": "Pathshala Club",
    "code": "PC",
    "category": "Social & Community",
    "tagline": "Illuminating young minds through free educational support and student tutoring.",
    "description": "Pathshala Club organizes volunteer teaching programs for underprivileged and rural school children, teaching science, basic computing, mathematics, and spoken English.",
    "objectives": [
      "Weekly volunteer tutoring sessions for students from nearby communities",
      "Donation of school kits, stationery, and science learning models",
      "Conducting creative science exhibitions and drawing workshops for young learners",
      "Career awareness and guidance sessions for high school students"
    ],
    "facultyAdvisors": [
      {
        "name": "Dr. B. Uma Maheswari",
        "department": "Physics"
      },
      {
        "name": "Dr. S. Siddhi",
        "department": "Biotech"
      }
    ],
    "facultyAdvisor": {
      "name": "Dr. B. Uma Maheswari",
      "designation": "Faculty Advisor",
      "department": "Physics"
    },
    "recruitmentStatus": null,
    "banner": "https://images.unsplash.com/photo-1509062522246-3755977927d7?auto=format&fit=crop&w=800&q=80",
    "foundedYear": 2014
  },
  {
    "name": "Global Leaders Forum",
    "code": "GLF",
    "category": "Leadership & Entrepreneurship",
    "tagline": "Cultivating diplomacy, geopolitical awareness, and executive leadership.",
    "description": "Global Leaders Forum trains students in international diplomacy, crisis negotiation, and executive public leadership through simulated global summits and leadership conclaves.",
    "objectives": [
      "Hosting university Model United Nations (MUN) conferences",
      "Geopolitical roundtables and public policy debate workshops",
      "Crisis management and multilateral negotiation simulations",
      "Leadership conclaves featuring international relations analysts"
    ],
    "facultyAdvisors": [
      {
        "name": "Dr. K.P. Radhika",
        "department": "Humanities"
      },
      {
        "name": "Dr. D. Bhuvaneshwari",
        "department": "Humanities"
      }
    ],
    "facultyAdvisor": {
      "name": "Dr. K.P. Radhika",
      "designation": "Faculty Advisor",
      "department": "Humanities"
    },
    "recruitmentStatus": null,
    "banner": "https://images.unsplash.com/photo-1475721027785-f74eccf877e2?auto=format&fit=crop&w=800&q=80",
    "foundedYear": 2015
  },
  {
    "name": "International Education Cell",
    "code": "IEC",
    "category": "Leadership & Entrepreneurship",
    "tagline": "Guiding students toward global higher education, scholarships, and research.",
    "description": "The International Education Cell supports students aspiring for postgraduate studies abroad, offering GRE/TOEFL guidance, university shortlisting, and international scholarship workshops.",
    "objectives": [
      "Information sessions on GRE, GMAT, IELTS, and TOEFL preparation strategies",
      "Guidance on Statement of Purpose (SOP) writing and faculty recommendation letters",
      "Interactive panels with alumni studying in top global universities",
      "Seminars on European, American, and Asian research fellowships"
    ],
    "facultyAdvisors": [
      {
        "name": "Dr. J. Kanchana",
        "department": "Mechanical"
      },
      {
        "name": "Mr. D. Muralidhar",
        "department": "Training Manager"
      },
      {
        "name": "Mr. T. Venkatachalam",
        "department": "ECE"
      }
    ],
    "facultyAdvisor": {
      "name": "Dr. J. Kanchana",
      "designation": "Faculty Advisor",
      "department": "Mechanical"
    },
    "recruitmentStatus": null,
    "banner": "https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=800&q=80",
    "foundedYear": 2011
  },
  {
    "name": "Animal Welfare Club",
    "code": "AWC",
    "category": "Environment & Social Welfare",
    "tagline": "Championing humane treatment, compassionate rescue, and care for community animals.",
    "description": "Animal Welfare Club is committed to caring for community animals, managing campus feeding and vaccination drives, and fostering empathy toward domestic and stray animals.",
    "objectives": [
      "Campus animal healthcare, feeding, and anti-rabies vaccination programs",
      "Rescue, temporary fostering, and responsible adoption coordination",
      "Educational sessions on animal rights, humane coexistence, and wildlife ethics",
      "Organizing water bowl installations during hot summer months"
    ],
    "facultyAdvisors": [
      {
        "name": "Dr. K. Vaideki",
        "department": "Applied Science"
      },
      {
        "name": "Dr. J. Pradeep Kumar",
        "department": "Production"
      },
      {
        "name": "Dr. T. Magesh",
        "department": "Mechanical"
      }
    ],
    "facultyAdvisor": {
      "name": "Dr. K. Vaideki",
      "designation": "Faculty Advisor",
      "department": "Applied Science"
    },
    "recruitmentStatus": null,
    "banner": "https://images.unsplash.com/photo-1628009368231-7bb7cfcb0def?auto=format&fit=crop&w=800&q=80",
    "foundedYear": 2017
  },
  {
    "name": "Women in Development Cell",
    "code": "WDC",
    "category": "Social & Community",
    "tagline": "Empowering women engineers and leaders through mentorship, rights, and career growth.",
    "description": "Women in Development Cell creates a collaborative forum to empower women students in STEM, offering career mentorship, leadership workshops, health awareness, and gender equality initiatives.",
    "objectives": [
      "Mentorship programs pairing junior students with women tech leaders",
      "Workshops on career acceleration, corporate leadership, and negotiations",
      "Health, mental wellness, and ergonomic awareness seminars",
      "Celebrating International Women’s Day through student symposiums"
    ],
    "facultyAdvisors": [
      {
        "name": "Dr. N. Ganesh Kumar",
        "department": "Mechanical"
      },
      {
        "name": "Dr. R. Balasundaraprabhu",
        "department": "Physics"
      }
    ],
    "facultyAdvisor": {
      "name": "Dr. N. Ganesh Kumar",
      "designation": "Faculty Advisor",
      "department": "Mechanical"
    },
    "recruitmentStatus": null,
    "banner": "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=800&q=80",
    "foundedYear": 2013
  },
  {
    "name": "Association of Serious Quizzers",
    "code": "ASQ",
    "category": "Literary & Knowledge",
    "tagline": "Challenging curious minds across history, science, sports, and general trivia.",
    "description": "Association of Serious Quizzers conducts high-energy quiz competitions spanning general knowledge, pop culture, technology, history, and current affairs for campus intellectuals.",
    "objectives": [
      "Weekly campus quiz leagues and trivia scrimmages",
      "Hosting major inter-collegiate open quiz festivals",
      "Training students for national business, tech, and general quizzing events",
      "Curating topical quiz series on science, sports, and Indian heritage"
    ],
    "facultyAdvisors": [
      {
        "name": "Dr. R. Rajasudha",
        "department": "Mathematics"
      },
      {
        "name": "Dr. B. Nirosha",
        "department": "Chemistry"
      }
    ],
    "facultyAdvisor": {
      "name": "Dr. R. Rajasudha",
      "designation": "Faculty Advisor",
      "department": "Mathematics"
    },
    "recruitmentStatus": null,
    "banner": "https://images.unsplash.com/photo-1606326608606-aa0b62935f2b?auto=format&fit=crop&w=800&q=80",
    "foundedYear": 2010
  },
  {
    "name": "Student Research Council",
    "code": "SRC",
    "category": "Technical & Innovation",
    "tagline": "Catalyzing student research papers, patents, and scientific publications.",
    "description": "Student Research Council guides undergraduate and postgraduate students through academic research methodologies, literature reviews, peer-reviewed paper publications, and patents.",
    "objectives": [
      "Workshops on LaTeX typesetting, research paper writing, and journal submissions",
      "Guidance on patent filing processes and intellectual property rights",
      "Interdisciplinary research project collaboration across departments",
      "Annual Student Research Colloquium and paper presentation contests"
    ],
    "facultyAdvisors": [
      {
        "name": "Dr. Jayanta Mondal",
        "department": "Metallurgy"
      },
      {
        "name": "Dr. D. Chitra",
        "department": "English"
      }
    ],
    "facultyAdvisor": {
      "name": "Dr. Jayanta Mondal",
      "designation": "Faculty Advisor",
      "department": "Metallurgy"
    },
    "recruitmentStatus": null,
    "banner": "https://images.unsplash.com/photo-1532094349884-543bc11b234d?auto=format&fit=crop&w=800&q=80",
    "foundedYear": 2016
  },
  {
    "name": "Industry (Alumni) Interaction Forum",
    "code": "IIF",
    "category": "Leadership & Entrepreneurship",
    "tagline": "Bridging campus learners with distinguished alumni and industry leaders.",
    "description": "IIF creates active networking channels between enrolled students and successful alumni in diverse industries, providing career mentoring, mock interviews, and industry internships.",
    "objectives": [
      "Distinguished Alumni guest lecture series and career roadmap talks",
      "Industry mock interview drives and technical resume critique sessions",
      "Internship linkage and capstone project sponsorships with corporate partners",
      "Mentorship circles matching students with senior industry professionals"
    ],
    "facultyAdvisors": [
      {
        "name": "Dr. M. Kalayarasan",
        "department": "Mechanical"
      },
      {
        "name": "Ms. B. Nishanthi",
        "department": "EEE"
      }
    ],
    "facultyAdvisor": {
      "name": "Dr. M. Kalayarasan",
      "designation": "Faculty Advisor",
      "department": "Mechanical"
    },
    "recruitmentStatus": null,
    "banner": "https://images.unsplash.com/photo-1515187029135-18ee286d815b?auto=format&fit=crop&w=800&q=80",
    "foundedYear": 2012
  },
  {
    "name": "Radio Hub",
    "code": "RH",
    "category": "Music & Performing Arts",
    "tagline": "Broadcasting campus stories, student podcasts, audio shows, and campus announcements.",
    "description": "Radio Hub manages the official student-led campus radio network and podcast channel, producing talk shows, artist interviews, and student music playlists.",
    "objectives": [
      "Producing weekly campus podcast episodes featuring students and faculty",
      "Live coverage and voice announcements during collegiate cultural and sports fests",
      "Audio mixing, voice-over modulation, and sound editing bootcamps",
      "Radio play recordings, campus news roundups, and creative storytelling"
    ],
    "facultyAdvisors": [
      {
        "name": "Dr. P. Visalakshi",
        "department": "ECE"
      },
      {
        "name": "Dr. M. Sundaram",
        "department": "EEE"
      }
    ],
    "facultyAdvisor": {
      "name": "Dr. P. Visalakshi",
      "designation": "Faculty Advisor",
      "department": "ECE"
    },
    "recruitmentStatus": null,
    "banner": "https://images.unsplash.com/photo-1590602847861-f357a9332bbc?auto=format&fit=crop&w=800&q=80",
    "foundedYear": 2015
  },
  {
    "name": "Book Readers Club",
    "code": "BRC",
    "category": "Literary & Knowledge",
    "tagline": "Connecting enthusiastic readers through book reviews, literature circles, and reading drives.",
    "description": "Book Readers Club encourages lifelong reading habits through regular book discussion circles, author meetups, and campus book exchange libraries.",
    "objectives": [
      "Monthly book discussion circles spanning fiction, non-fiction, and philosophy",
      "Peer-to-peer campus book exchanges and mini reading corners",
      "Author interactive sessions and literary discussion panels",
      "Book review contests and reading marathon initiatives"
    ],
    "facultyAdvisors": [
      {
        "name": "Dr. A. Natarajan",
        "department": "EEE"
      },
      {
        "name": "Dr. M. Bagyalakshmi",
        "department": "Mathematics"
      }
    ],
    "facultyAdvisor": {
      "name": "Dr. A. Natarajan",
      "designation": "Faculty Advisor",
      "department": "EEE"
    },
    "recruitmentStatus": null,
    "banner": "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?auto=format&fit=crop&w=800&q=80",
    "foundedYear": 2011
  },
  {
    "name": "PSG Tech Chronicle Club",
    "code": "PTC",
    "category": "Literary & Knowledge",
    "tagline": "Chronicling campus milestones, student achievements, and investigative journalism.",
    "description": "PSG Tech Chronicle Club is the student-run journalistic body responsible for publishing the official campus newsletter, highlighting student innovations, and documenting college history.",
    "objectives": [
      "Publishing regular issues of the student newsletter and college chronicle",
      "Investigative journalism covering campus innovations and student accomplishments",
      "Photography, photojournalism, and digital publication layout design",
      "Interviewing distinguished guest lecturers, deans, and visiting researchers"
    ],
    "facultyAdvisors": [
      {
        "name": "Dr. Mariyam Adnan",
        "department": "AFD"
      },
      {
        "name": "Mr. J. Prakash",
        "department": "CSE"
      }
    ],
    "facultyAdvisor": {
      "name": "Dr. Mariyam Adnan",
      "designation": "Faculty Advisor",
      "department": "AFD"
    },
    "recruitmentStatus": null,
    "banner": "https://images.unsplash.com/photo-1504711434969-e33886168f5c?auto=format&fit=crop&w=800&q=80",
    "foundedYear": 2008
  },
  {
    "name": "Youth Outreach Club",
    "code": "YOC",
    "category": "Social & Community",
    "tagline": "Engaging youth in grassroots social welfare, literacy drives, and rural aid.",
    "description": "Youth Outreach Club works closely with rural communities and governmental initiatives to conduct village health drives, digital literacy sessions, and social awareness campaigns.",
    "objectives": [
      "Rural outreach programs fostering basic digital and financial literacy",
      "Hygiene, clean water, and sanitation awareness workshops in local villages",
      "Youth civic responsibility seminars and active volunteer mentorship",
      "Coordinating donation drives for clothing, stationery, and essential resources"
    ],
    "facultyAdvisors": [
      {
        "name": "Dr. S. Sankaraktumar",
        "department": "Applied Science"
      },
      {
        "name": "Dr. A. Sivaranjani",
        "department": "English"
      }
    ],
    "facultyAdvisor": {
      "name": "Dr. S. Sankaraktumar",
      "designation": "Faculty Advisor",
      "department": "Applied Science"
    },
    "recruitmentStatus": null,
    "banner": "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=800&q=80",
    "foundedYear": 2014
  },
  {
    "name": "Artificial Intelligence & Robotics Club",
    "code": "AIR",
    "category": "Technical & Innovation",
    "tagline": "Pioneering machine learning, autonomous systems, and advanced robotics engineering.",
    "description": "AIR Club empowers students to build autonomous robots, computer vision algorithms, and intelligent robotic rovers for national robotics and AI challenges.",
    "objectives": [
      "Hands-on bootcamps in ROS2, Arduino, Raspberry Pi, and Embedded C/C++",
      "Computer vision, NLP, and Deep Learning model implementation projects",
      "Building autonomous mobile robots, line followers, and combat drones",
      "Participating in national robotics challenges and hackathons"
    ],
    "facultyAdvisors": [
      {
        "name": "Ms. M. Radhiga",
        "department": "Mathematics"
      },
      {
        "name": "Dr. K. Boopathi",
        "department": "Applied Science"
      }
    ],
    "facultyAdvisor": {
      "name": "Ms. M. Radhiga",
      "designation": "Faculty Advisor",
      "department": "Mathematics"
    },
    "recruitmentStatus": null,
    "banner": "https://images.unsplash.com/photo-1485827404703-89b55fcc595e?auto=format&fit=crop&w=800&q=80",
    "foundedYear": 2018
  },
  {
    "name": "Aeromodelling Club",
    "code": "AMC",
    "category": "Technical & Innovation",
    "tagline": "Designing, fabricating, and flying radio-controlled aircraft and autonomous UAVs.",
    "description": "Aeromodelling Club introduces students to aeronautics, RC planes, quadcopters, and autonomous drone design through hands-on fabrication and flying workshops.",
    "objectives": [
      "Design and wind-tunnel testing of RC glider aircraft and balsa planes",
      "Drone flight mechanics, ESC calibration, and autonomous GPS waypoint mapping",
      "Participating in Boeing and collegiate UAV design competitions",
      "Seminars on aircraft aerodynamics and aerospace engineering trends"
    ],
    "facultyAdvisors": [
      {
        "name": "Dr. P.D. Rathika",
        "department": "RAE"
      },
      {
        "name": "Dr. P. Sivakumar",
        "department": "EEE"
      }
    ],
    "facultyAdvisor": {
      "name": "Dr. P.D. Rathika",
      "designation": "Faculty Advisor",
      "department": "RAE"
    },
    "recruitmentStatus": null,
    "banner": "https://images.unsplash.com/photo-1527977966376-1c8408f9f108?auto=format&fit=crop&w=800&q=80",
    "foundedYear": 2013
  },
  {
    "name": "Finverse Club",
    "code": "FC",
    "category": "Technical & Innovation",
    "tagline": "Empowering students in financial markets, quantitative analytics, and FinTech.",
    "description": "Finverse Club educates students in personal financial literacy, stock market algorithmic analysis, quantitative modeling, and blockchain financial innovations.",
    "objectives": [
      "Virtual equity trading simulations and portfolio management leagues",
      "Workshops on financial statement analysis, valuation, and quantitative models",
      "Guest lectures by financial analysts, wealth managers, and FinTech innovators",
      "Personal budgeting, mutual funds, and taxation literacy sessions for students"
    ],
    "facultyAdvisors": [
      {
        "name": "Dr. S. Pratheesh Kumar",
        "department": "Production"
      }
    ],
    "facultyAdvisor": {
      "name": "Dr. S. Pratheesh Kumar",
      "designation": "Faculty Advisor",
      "department": "Production"
    },
    "recruitmentStatus": null,
    "banner": "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?auto=format&fit=crop&w=800&q=80",
    "foundedYear": 2021
  },
  {
    "name": "SPIC-MACAY Heritage Club",
    "code": "SMHC",
    "category": "Music & Performing Arts",
    "tagline": "Preserving Indian classical arts, folk heritage, and world cultural traditions.",
    "description": "Affiliated with SPIC-MACAY, this club brings legendary Indian classical musicians, dancers, and folk artists to perform and interact with students on campus.",
    "objectives": [
      "Hosting Indian classical music concerts featuring maestro vocalists and instrumentalists",
      "Workshops in classical dance forms including Bharatanatyam, Kathak, and Kuchipudi",
      "Folk arts appreciation sessions highlighting regional traditions of India",
      "Yoga, meditation, and cultural heritage preservation seminars"
    ],
    "facultyAdvisors": [
      {
        "name": "Dr. V.M. Sangeetha",
        "department": "Humanities"
      },
      {
        "name": "Dr. R. Shankar",
        "department": "Humanities"
      }
    ],
    "facultyAdvisor": {
      "name": "Dr. V.M. Sangeetha",
      "designation": "Faculty Advisor",
      "department": "Humanities"
    },
    "recruitmentStatus": null,
    "banner": "https://images.unsplash.com/photo-1677254112848-af772a6661c5?auto=format&fit=crop&w=800&q=80",
    "foundedYear": 2002
  },
  {
    "name": "Anti Drug Club",
    "code": "ADC",
    "category": "Environment & Social Welfare",
    "tagline": "Advocating drug-free living, mental health wellness, and youth substance awareness.",
    "description": "Anti Drug Club conducts youth awareness campaigns, guest lectures by doctors and counselors, and wellness activities to promote substance-free healthy living.",
    "objectives": [
      "Organizing campus awareness rallies and drug-abuse prevention seminars",
      "Interactive sessions with mental health psychologists and addiction counselors",
      "Poster presentation and short film competitions promoting clean lifestyles",
      "Peer-support volunteer networks for student mental wellness and fitness"
    ],
    "facultyAdvisors": [
      {
        "name": "Dr. M.R. Sri Krishnan",
        "department": "FT"
      },
      {
        "name": "Dr. M.S. Sangeetha",
        "department": "Biomedical"
      }
    ],
    "facultyAdvisor": {
      "name": "Dr. M.R. Sri Krishnan",
      "designation": "Faculty Advisor",
      "department": "FT"
    },
    "recruitmentStatus": null,
    "banner": "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=800&q=80",
    "foundedYear": 2019
  },
  {
    "name": "Yuva Tourism Club",
    "code": "YTC",
    "category": "Social & Community",
    "tagline": "Discovering cultural landmarks, heritage trails, and eco-responsible tourism.",
    "description": "Yuva Tourism Club develops appreciation for national heritage, historical monuments, and sustainable eco-tourism through guided educational excursions and travel photography.",
    "objectives": [
      "Educational visits to historical sites, archaeological monuments, and heritage centers",
      "Promoting responsible and sustainable eco-tourism among college students",
      "Travel photography, cultural journaling, and documentary competitions",
      "Celebrating World Tourism Day through seminars and cultural exhibits"
    ],
    "facultyAdvisors": [
      {
        "name": "Dr. P. Prabhavathi",
        "department": "ECE"
      },
      {
        "name": "Mr. N. Muthuram",
        "department": "Production"
      }
    ],
    "facultyAdvisor": {
      "name": "Dr. P. Prabhavathi",
      "designation": "Faculty Advisor",
      "department": "ECE"
    },
    "recruitmentStatus": null,
    "banner": "https://images.unsplash.com/photo-1524492412937-b28074a5d7da?auto=format&fit=crop&w=800&q=80",
    "foundedYear": 2022
  },
  {
    "name": "Cyber Security Club",
    "code": "CSC",
    "category": "Technical & Innovation",
    "tagline": "Defending cyberspace through ethical hacking, digital forensics, and CTF challenges.",
    "description": "Cyber Security Club focuses on offensive and defensive cybersecurity techniques, vulnerability assessments, network defense, and hosting Capture The Flag (CTF) competitions.",
    "objectives": [
      "Cybersecurity workshops covering network security, cryptography, and defense",
      "Ethical hacking awareness, vulnerability scanning, and secure coding labs",
      "Capture The Flag (CTF) national competitions and reverse-engineering challenges",
      "Technical sessions on bug bounty hunting, malware defense, and cyber hygiene"
    ],
    "facultyAdvisors": [
      {
        "name": "Dr. V. Sakthirama",
        "department": "IM"
      },
      {
        "name": "Dr. R. Rudresh",
        "department": "English"
      },
      {
        "name": "Dr. N. Ilayaraja",
        "department": "CA"
      }
    ],
    "facultyAdvisor": {
      "name": "Dr. V. Sakthirama",
      "designation": "Faculty Advisor",
      "department": "IM"
    },
    "recruitmentStatus": null,
    "banner": "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=800&q=80",
    "foundedYear": 2017
  }
];

module.exports = {
  clubs30,
  categoryFilters
};
