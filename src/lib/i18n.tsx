"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";

type Lang = "en" | "fr";

const en = {
  // Navigation
  feed: "Feed", events: "Events", market: "Market", support: "Support",
  profile: "Profile", groups: "Groups", search: "Search", admin: "Admin",
  lostFound: "Lost & Found",

  // Feed
  campusFeed: "Campus Feed", following: "Following", trending: "Trending",
  peek: "Peek (Other Unis)", createPost: "Create Post", addStory: "Add Story",
  officialAnnouncements: "Official Announcements", allCaughtUp: "You're all caught up",
  scamFilterNotice: "Automated scam filters active — flagged posts go to admin review.",

  // Post actions
  upvote: "Upvote", downvote: "Downvote", comment: "Comment", share: "Share",
  save: "Save Post", unsave: "Unsave Post", report: "Report",
  repost: "Repost", repostWithThoughts: "Repost with thoughts",
  shareVia: "Share via...", copyLink: "Copy link", shareWhatsApp: "Share on WhatsApp",
  shareInstantly: "Share instantly", postShared: "Post shared!", linkCopied: "Link copied!",
  aiSummary: "AI Summary", analyzing: "Analyzing…", aiInsight: "AI Insight",
  writeComment: "Write a comment…", like: "Like", reply: "Reply",
  addYourThoughts: "Add your thoughts…",

  // Create post
  shareWithCampus: "Share with Campus", whatsOnMind: "What's on your mind?",
  audience: "Audience", everyone: "Everyone on campus", department: "My department only",
  friendsOnly: "Friends only", addMedia: "Add Media (Optional)", publishPost: "Publish Post",
  cancel: "Cancel", characters: "characters", aiSuggestionsAvailable: "AI suggestions available",
  channel: "Channel",

  // Stories
  story: "Story", viewStory: "View Story", liveNow: "LIVE",

  // Profile
  editProfile: "Edit Profile", connections: "Connections", followers: "Followers",
  following2: "Following", posts: "Posts", media: "Media", saved: "Saved",
  settings: "Settings", about: "About", saveChanges: "Save Changes",
  academicField: "Academic Field", interests: "Interests", bio: "Bio",
  draftWithAI: "Draft with AI", joinedDate: "Joined",
  noSavedPosts: "No saved posts yet", savedPostsHint: "Posts you save will appear here",
  publicProfile: "Public Profile", publicProfileDesc: "Anyone on campus can see your profile",
  pushNotifications: "Push Notifications", pushNotifDesc: "Alerts for messages and campus news",

  // Connections
  myConnections: "My Connections", addFriend: "Add Friend", findPeople: "Find People",
  searchPeople: "Search people…", sendRequest: "Connect", pending: "Pending",
  connected: "Connected", message: "Message", mutualConnections: "mutual connections",

  // Groups
  campusGroups: "Campus Groups", createGroup: "Create Group", joinGroup: "Join",
  joined: "Joined", members: "members", searchGroups: "Search groups…",
  myGroups: "My Groups", discover: "Discover", groupName: "Group Name",
  groupDescription: "Description", groupType: "Type",
  publicGroup: "Public", privateGroup: "Private",
  groupCreated: "Group created!", groupLeft: "Left group", groupJoined: "Joined group!",
  whatIsGroupAbout: "What is this group about?",

  // Search
  searchPlaceholder: "Search people, groups, posts…", people: "People",
  results: "Results", noResults: "No results found",
  tryDifferent: "Try a different search term",

  // Lost & Found
  lostFoundTitle: "Lost & Found",
  lostFoundSubtitle: "Help reunite students with their belongings",
  reportItem: "Report Item", lostItems: "Lost", foundItems: "Found",
  resolvedItems: "Resolved", noLostItems: "No lost items",
  noFoundItems: "No found items", noResolvedItems: "No resolved items",
  markResolved: "Mark Resolved", contact: "Contact",
  contactOwner: "Contact about this item",
  iLostSomething: "I Lost Something", iFoundSomething: "I Found Something",
  itemName: "Item Name", itemNamePlaceholder: "e.g. Blue Jacket, Student ID…",
  itemDescription: "Description", itemDescPlaceholder: "Describe the item, any identifying features…",
  location: "Location", locationPlaceholder: "e.g. Library, Block A",
  itemCategory: "Category", postItem: "Post Item",
  lostReported: "Lost item reported!", foundPosted: "Found item posted!",
  studentsNotified: "Other students will be notified.",
  markedResolved: "Marked as resolved!",
  itemReunited: "Great news — item reunited with owner.",
  sendMessage: "Send Message", messagePlaceholder: "Write a message about this item…",
  messageSent: "Message sent!", messageDesc: "The poster will be notified.",

  // Settings
  appearance: "Appearance", theme: "Theme", language: "Language",
  chooseTheme: "Choose your theme", chooseLanguage: "Choose language",
  notifications: "Notifications", privacy: "Privacy", account: "Account",
  dangerZone: "Danger Zone", deleteAccount: "Delete Account",
  lightMode: "Light Mode", darkMode: "Dark Mode",

  // Support
  supportCenter: "Support Center",
  supportSubtitle: "Report issues, request help, or flag bad behavior. We close the loop — you'll hear back.",
  techSupport: "Tech Support", techSupportDesc: "App bugs, login issues, feature requests",
  reportBehavior: "Report Behavior", reportBehaviorDesc: "Harassment, scams, or policy violations",
  generalInquiry: "General Inquiry", generalInquiryDesc: "Account changes, feedback, suggestions",
  submitTicket: "Submit a Ticket", avgResponseTime: "Avg. response time: under 24 hours",
  myTickets: "My Tickets", category: "Category", subject: "Subject", details: "Details",
  submit: "Submit Ticket", ticketReceived: "Ticket Received!",
  closedLoopFeedback: "Closed-loop feedback active — you'll hear back",
  submitAnother: "Submit Another", reportsPrivate: "All reports are reviewed privately. Your identity is protected.",
  selectCategory: "Select a category...", briefDescription: "Brief description of your issue",
  describeIssue: "Describe the issue in detail…",
  ticketSubmitted: "Ticket Submitted", ticketFollowUp: "We'll review your request and follow up shortly.",
  updatedAt: "Updated",

  // Auth
  signIn: "Sign In", signUp: "Sign Up", email: "Email", password: "Password",
  forgotPassword: "Forgot password?", joinCampus: "Join Your Campus",
  welcomeBack: "Welcome to Dash", premiumPlatform: "The premium university connection platform.",
  enterCredentials: "Enter your credentials to access campus",
  verifiedCampus: "Verified Campus Boundary Enforced",
  newHere: "New here?", joinCommunity: "Join your university community",
  joinDash: "Join Dash", premiumExperience: "The premium campus experience, built for students.",
  yourSchool: "Your School", selectUniversity: "Select your university…",
  useSchoolEmail: "Use your @{domain} email address",
  institutionalEmail: "Institutional Email", wrongDomain: "Please use your school email address",
  agreeTerms: "I agree to the Terms of Service", createAccount: "Create Account",
  alreadyHaveAccount: "Already have an account?", noAccount: "Don't have an account?",
  institutionalEmailRequired: "Institutional email verification required",
  verifyEmail: "Verify Email", codeSentTo: "We sent a 6-digit code to",
  verificationCode: "Verification Code", verifyAndContinue: "Verify & Continue",
  resendCode: "Resend Code", awaitingApproval: "Awaiting Admin Approval",
  approvalPending: "Your account is pending approval from your school admin.",
  whatHappensNext: "What happens next?",
  step1Approval: "Your school admin reviews your registration",
  step2Email: "You'll receive an email once approved",
  step3Profile: "Sign in and complete your profile",
  fullName: "Full Name", username: "Username", faculty: "Faculty",
  yearOfStudy: "Year of Study", confirmPassword: "Confirm Password",
  schoolName: "School Name", schoolDomain: "School Email Domain",

  // Admin
  adminPanel: "Admin Panel", manageStudents: "Manage Students",
  broadcastAnnouncement: "Broadcast Announcement", moderationQueue: "Moderation Queue",
  pendingApprovals: "Pending Approvals", approveStudent: "Approve",
  rejectStudent: "Reject", revokeAccess: "Revoke Access",
  studentAdmin: "Student Admin", mainAdmin: "Main Admin",
  adminPortalTitle: "Dash Admin Portal",
  pendingTab: "Pending", studentsTab: "Students", flaggedTab: "Flagged",
  schoolSettings: "School Settings", allReviewed: "All registrations reviewed",
  noFlaggedContent: "No flagged content", removeContent: "Remove Content",
  dismiss: "Dismiss", makeAdmin: "Make Admin", removeAdmin: "Remove Admin",
  suspend: "Suspend", restore: "Restore", broadcast: "Broadcast",
  broadcastMsg: "Write your announcement to all students…",
  broadcastNote: "This will be pinned as an official announcement visible to all students in the campus feed.",
  announcementBroadcast: "Announcement broadcast!",
  allStudentsNotified: "All students have been notified.",
  allowedDomain: "Allowed Email Domain",
  domainNote: "Students must register with an email ending in this domain. Not limited to .edu — any institutional domain works.",
  requireApproval: "Require Admin Approval",
  requireApprovalDesc: "When enabled, students must be approved before accessing the platform",
  saveSettings: "Save Settings", organizedBy: "Organized by",

  // General
  loading: "Loading", online: "Online", verified: "Verified", anonymous: "Anonymous",
  showIdentity: "Show Identity", postAnonymously: "Post Anonymously",
  viewAll: "View all", showMore: "Show more", close: "Close", done: "Done",
  back: "Back", next: "Next", skip: "Skip for now", enterDash: "Enter Dash",
  copyright: "© 2025 Dash — Campus Connect",

  // Language picker
  chooseYourLanguage: "Choose Your Language",
  languagePickerSubtitle: "Select your preferred language to continue",
  continueBtn: "Continue",

  // Onboarding tour
  tourWelcomeTitle: "Welcome to Dash! 👋",
  tourWelcomeDesc: "Your campus, all in one place. Let's show you around.",
  tourFeedTitle: "Campus Feed",
  tourFeedDesc: "See posts, announcements, and updates from your campus community in real time.",
  tourGroupsTitle: "Groups & Communities",
  tourGroupsDesc: "Join study groups, clubs, and communities that match your interests.",
  tourMarketTitle: "Marketplace",
  tourMarketDesc: "Buy and sell textbooks, electronics, and more with fellow students.",
  tourEventsTitle: "Events",
  tourEventsDesc: "Discover and RSVP to campus events, workshops, and social gatherings.",
  tourLostTitle: "Lost & Found",
  tourLostDesc: "Report lost items or help return found items to their owners.",
  tourSupportTitle: "Support",
  tourSupportDesc: "Submit tickets, report issues, or flag harmful content.",
  tourDoneTitle: "You're all set! 🎉",
  tourDoneDesc: "Explore Dash and connect with your campus community.",
  getStarted: "Get Started",
  ofSteps: "of",
};

type TranslationKey = keyof typeof en;

const fr: Record<TranslationKey, string> = {
  // Navigation
  feed: "Fil", events: "Événements", market: "Marché", support: "Support",
  profile: "Profil", groups: "Groupes", search: "Rechercher", admin: "Admin",
  lostFound: "Objets Trouvés",

  // Feed
  campusFeed: "Fil du Campus", following: "Abonnements", trending: "Tendances",
  peek: "Voir (Autres Universités)", createPost: "Créer un post", addStory: "Ajouter une story",
  officialAnnouncements: "Annonces Officielles", allCaughtUp: "Vous êtes à jour",
  scamFilterNotice: "Filtres anti-arnaque actifs — les posts signalés vont en révision admin.",

  // Post actions
  upvote: "Voter pour", downvote: "Voter contre", comment: "Commenter", share: "Partager",
  save: "Enregistrer", unsave: "Retirer", report: "Signaler",
  repost: "Republier", repostWithThoughts: "Republier avec commentaire",
  shareVia: "Partager via…", copyLink: "Copier le lien", shareWhatsApp: "Partager sur WhatsApp",
  shareInstantly: "Partager instantanément", postShared: "Post partagé !", linkCopied: "Lien copié !",
  aiSummary: "Résumé IA", analyzing: "Analyse…", aiInsight: "Aperçu IA",
  writeComment: "Écrire un commentaire…", like: "J'aime", reply: "Répondre",
  addYourThoughts: "Ajoutez vos pensées…",

  // Create post
  shareWithCampus: "Partager avec le Campus", whatsOnMind: "Quoi de neuf ?",
  audience: "Audience", everyone: "Tout le campus", department: "Mon département seulement",
  friendsOnly: "Amis seulement", addMedia: "Ajouter un média (Optionnel)", publishPost: "Publier",
  cancel: "Annuler", characters: "caractères", aiSuggestionsAvailable: "Suggestions IA disponibles",
  channel: "Canal",

  // Stories
  story: "Story", viewStory: "Voir la story", liveNow: "EN DIRECT",

  // Profile
  editProfile: "Modifier le profil", connections: "Connexions", followers: "Abonnés",
  following2: "Abonnements", posts: "Posts", media: "Médias", saved: "Enregistrés",
  settings: "Paramètres", about: "À propos", saveChanges: "Enregistrer",
  academicField: "Domaine académique", interests: "Intérêts", bio: "Bio",
  draftWithAI: "Rédiger avec l'IA", joinedDate: "Rejoint",
  noSavedPosts: "Aucun post enregistré", savedPostsHint: "Les posts que vous enregistrez apparaîtront ici",
  publicProfile: "Profil public", publicProfileDesc: "Tout le campus peut voir votre profil",
  pushNotifications: "Notifications push", pushNotifDesc: "Alertes pour messages et actualités du campus",

  // Connections
  myConnections: "Mes Connexions", addFriend: "Ajouter un ami", findPeople: "Trouver des personnes",
  searchPeople: "Rechercher des personnes…", sendRequest: "Connecter", pending: "En attente",
  connected: "Connecté", message: "Message", mutualConnections: "connexions en commun",

  // Groups
  campusGroups: "Groupes du Campus", createGroup: "Créer un groupe", joinGroup: "Rejoindre",
  joined: "Rejoint", members: "membres", searchGroups: "Rechercher des groupes…",
  myGroups: "Mes Groupes", discover: "Découvrir", groupName: "Nom du groupe",
  groupDescription: "Description", groupType: "Type",
  publicGroup: "Public", privateGroup: "Privé",
  groupCreated: "Groupe créé !", groupLeft: "Groupe quitté", groupJoined: "Groupe rejoint !",
  whatIsGroupAbout: "De quoi parle ce groupe ?",

  // Search
  searchPlaceholder: "Rechercher personnes, groupes, posts…", people: "Personnes",
  results: "Résultats", noResults: "Aucun résultat",
  tryDifferent: "Essayez un autre terme de recherche",

  // Lost & Found
  lostFoundTitle: "Objets Trouvés",
  lostFoundSubtitle: "Aidez à réunir les étudiants avec leurs affaires",
  reportItem: "Signaler un objet", lostItems: "Perdus", foundItems: "Trouvés",
  resolvedItems: "Résolus", noLostItems: "Aucun objet perdu",
  noFoundItems: "Aucun objet trouvé", noResolvedItems: "Aucun objet résolu",
  markResolved: "Marquer résolu", contact: "Contacter",
  contactOwner: "Contacter à propos de cet objet",
  iLostSomething: "J'ai perdu quelque chose", iFoundSomething: "J'ai trouvé quelque chose",
  itemName: "Nom de l'objet", itemNamePlaceholder: "ex. Veste bleue, Carte étudiant…",
  itemDescription: "Description", itemDescPlaceholder: "Décrivez l'objet, ses caractéristiques…",
  location: "Lieu", locationPlaceholder: "ex. Bibliothèque, Bloc A",
  itemCategory: "Catégorie", postItem: "Publier l'objet",
  lostReported: "Objet perdu signalé !", foundPosted: "Objet trouvé publié !",
  studentsNotified: "Les autres étudiants seront notifiés.",
  markedResolved: "Marqué comme résolu !",
  itemReunited: "Super — l'objet a été rendu à son propriétaire.",
  sendMessage: "Envoyer un message", messagePlaceholder: "Écrivez un message sur cet objet…",
  messageSent: "Message envoyé !", messageDesc: "L'auteur sera notifié.",

  // Settings
  appearance: "Apparence", theme: "Thème", language: "Langue",
  chooseTheme: "Choisir votre thème", chooseLanguage: "Choisir la langue",
  notifications: "Notifications", privacy: "Confidentialité", account: "Compte",
  dangerZone: "Zone dangereuse", deleteAccount: "Supprimer le compte",
  lightMode: "Mode clair", darkMode: "Mode sombre",

  // Support
  supportCenter: "Centre d'assistance",
  supportSubtitle: "Signalez des problèmes, demandez de l'aide ou signalez des comportements. Nous vous répondrons.",
  techSupport: "Support technique", techSupportDesc: "Bugs, problèmes de connexion, demandes de fonctionnalités",
  reportBehavior: "Signaler un comportement", reportBehaviorDesc: "Harcèlement, arnaques, violations de politique",
  generalInquiry: "Demande générale", generalInquiryDesc: "Changements de compte, retours, suggestions",
  submitTicket: "Soumettre un ticket", avgResponseTime: "Temps de réponse moyen : moins de 24 heures",
  myTickets: "Mes tickets", category: "Catégorie", subject: "Sujet", details: "Détails",
  submit: "Soumettre", ticketReceived: "Ticket reçu !",
  closedLoopFeedback: "Retour en boucle fermée actif — vous aurez une réponse",
  submitAnother: "Soumettre un autre", reportsPrivate: "Tous les rapports sont examinés en privé. Votre identité est protégée.",
  selectCategory: "Sélectionner une catégorie...", briefDescription: "Brève description de votre problème",
  describeIssue: "Décrivez le problème en détail…",
  ticketSubmitted: "Ticket soumis", ticketFollowUp: "Nous examinerons votre demande et vous répondrons.",
  updatedAt: "Mis à jour",

  // Auth
  signIn: "Se connecter", signUp: "S'inscrire", email: "Email", password: "Mot de passe",
  forgotPassword: "Mot de passe oublié ?", joinCampus: "Rejoindre votre campus",
  welcomeBack: "Bienvenue sur Dash", premiumPlatform: "La plateforme universitaire premium.",
  enterCredentials: "Entrez vos identifiants pour accéder au campus",
  verifiedCampus: "Frontière campus vérifiée active",
  newHere: "Nouveau ici ?", joinCommunity: "Rejoignez votre communauté universitaire",
  joinDash: "Rejoindre Dash", premiumExperience: "L'expérience campus premium, faite pour les étudiants.",
  yourSchool: "Votre école", selectUniversity: "Sélectionnez votre université…",
  useSchoolEmail: "Utilisez votre email @{domain}",
  institutionalEmail: "Email institutionnel", wrongDomain: "Veuillez utiliser votre adresse email scolaire",
  agreeTerms: "J'accepte les Conditions d'utilisation", createAccount: "Créer un compte",
  alreadyHaveAccount: "Vous avez déjà un compte ?", noAccount: "Pas encore de compte ?",
  institutionalEmailRequired: "Vérification de l'email institutionnel requise",
  verifyEmail: "Vérifier l'email", codeSentTo: "Nous avons envoyé un code à 6 chiffres à",
  verificationCode: "Code de vérification", verifyAndContinue: "Vérifier et continuer",
  resendCode: "Renvoyer le code", awaitingApproval: "En attente d'approbation",
  approvalPending: "Votre compte est en attente d'approbation par l'administrateur de votre école.",
  whatHappensNext: "Que se passe-t-il ensuite ?",
  step1Approval: "L'administrateur de votre école examine votre inscription",
  step2Email: "Vous recevrez un email une fois approuvé",
  step3Profile: "Connectez-vous et complétez votre profil",
  fullName: "Nom complet", username: "Nom d'utilisateur", faculty: "Faculté",
  yearOfStudy: "Année d'études", confirmPassword: "Confirmer le mot de passe",
  schoolName: "Nom de l'école", schoolDomain: "Domaine email de l'école",

  // Admin
  adminPanel: "Panneau Admin", manageStudents: "Gérer les étudiants",
  broadcastAnnouncement: "Diffuser une annonce", moderationQueue: "File de modération",
  pendingApprovals: "Approbations en attente", approveStudent: "Approuver",
  rejectStudent: "Rejeter", revokeAccess: "Révoquer l'accès",
  studentAdmin: "Admin Étudiant", mainAdmin: "Admin Principal",
  adminPortalTitle: "Portail Admin Dash",
  pendingTab: "En attente", studentsTab: "Étudiants", flaggedTab: "Signalés",
  schoolSettings: "Paramètres de l'école", allReviewed: "Toutes les inscriptions examinées",
  noFlaggedContent: "Aucun contenu signalé", removeContent: "Supprimer le contenu",
  dismiss: "Ignorer", makeAdmin: "Nommer admin", removeAdmin: "Retirer admin",
  suspend: "Suspendre", restore: "Restaurer", broadcast: "Diffuser",
  broadcastMsg: "Rédigez votre annonce pour tous les étudiants…",
  broadcastNote: "Ceci sera épinglé comme annonce officielle visible par tous les étudiants.",
  announcementBroadcast: "Annonce diffusée !",
  allStudentsNotified: "Tous les étudiants ont été notifiés.",
  allowedDomain: "Domaine email autorisé",
  domainNote: "Les étudiants doivent s'inscrire avec un email se terminant par ce domaine. Pas limité à .edu.",
  requireApproval: "Approbation admin requise",
  requireApprovalDesc: "Quand activé, les étudiants doivent être approuvés avant d'accéder à la plateforme",
  saveSettings: "Enregistrer les paramètres", organizedBy: "Organisé par",

  // General
  loading: "Chargement", online: "En ligne", verified: "Vérifié", anonymous: "Anonyme",
  showIdentity: "Afficher l'identité", postAnonymously: "Poster anonymement",
  viewAll: "Voir tout", showMore: "Voir plus", close: "Fermer", done: "Terminé",
  back: "Retour", next: "Suivant", skip: "Passer pour l'instant", enterDash: "Entrer dans Dash",
  copyright: "© 2025 Dash — Campus Connect",

  // Language picker
  chooseYourLanguage: "Choisissez votre langue",
  languagePickerSubtitle: "Sélectionnez votre langue préférée pour continuer",
  continueBtn: "Continuer",

  // Onboarding tour
  tourWelcomeTitle: "Bienvenue sur Dash ! 👋",
  tourWelcomeDesc: "Votre campus, tout en un seul endroit. Laissez-nous vous faire visiter.",
  tourFeedTitle: "Fil du Campus",
  tourFeedDesc: "Voyez les posts, annonces et mises à jour de votre communauté campus en temps réel.",
  tourGroupsTitle: "Groupes et Communautés",
  tourGroupsDesc: "Rejoignez des groupes d'étude, clubs et communautés qui correspondent à vos intérêts.",
  tourMarketTitle: "Marché",
  tourMarketDesc: "Achetez et vendez des manuels, électroniques et plus avec vos camarades.",
  tourEventsTitle: "Événements",
  tourEventsDesc: "Découvrez et confirmez votre présence aux événements, ateliers et rassemblements.",
  tourLostTitle: "Objets Trouvés",
  tourLostDesc: "Signalez des objets perdus ou aidez à rendre des objets trouvés à leurs propriétaires.",
  tourSupportTitle: "Support",
  tourSupportDesc: "Soumettez des tickets, signalez des problèmes ou du contenu nuisible.",
  tourDoneTitle: "Vous êtes prêt ! 🎉",
  tourDoneDesc: "Explorez Dash et connectez-vous avec votre communauté campus.",
  getStarted: "Commencer",
  ofSteps: "sur",
};

interface I18nContextType {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (key: TranslationKey) => string;
}

const I18nContext = createContext<I18nContextType>({
  lang: "en", setLang: () => {}, t: (k) => en[k] ?? k,
});

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>("en");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("dash-lang") as Lang | null;
    if (stored === "en" || stored === "fr") setLangState(stored);
    setReady(true);
  }, []);

  const setLang = (l: Lang) => {
    setLangState(l);
    localStorage.setItem("dash-lang", l);
  };

  const t = (key: TranslationKey): string => {
    const dict = lang === "fr" ? fr : en;
    return dict[key] ?? en[key] ?? key;
  };

  if (!ready) return null;

  return <I18nContext.Provider value={{ lang, setLang, t }}>{children}</I18nContext.Provider>;
}

export const useI18n = () => useContext(I18nContext);
