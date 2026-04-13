"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";

type Lang = "en" | "fr";

const translations = {
  en: {
    // Nav
    feed: "Feed", events: "Events", market: "Market", support: "Support", profile: "Profile",
    groups: "Groups", search: "Search", admin: "Admin",
    // Feed
    campusFeed: "Campus Feed", following: "Following", trending: "Trending", peek: "Peek (Other Unis)",
    createPost: "Create Post", addStory: "Add Story", officialAnnouncements: "Official Announcements",
    allCaughtUp: "You're all caught up",
    // Post actions
    upvote: "Upvote", downvote: "Downvote", comment: "Comment", share: "Share", save: "Save Post",
    unsave: "Unsave Post", report: "Report", repost: "Repost", repostWithThoughts: "Repost with thoughts",
    shareVia: "Share via...", copyLink: "Copy link", shareWhatsApp: "Share on WhatsApp",
    shareInstantly: "Share instantly", postShared: "Post shared!", linkCopied: "Link copied!",
    aiSummary: "AI Summary", analyzing: "Analyzing…", aiInsight: "AI Insight",
    writeComment: "Write a comment…", like: "Like", reply: "Reply",
    // Create post
    shareWithCampus: "Share with Campus", whatsOnMind: "What's on your mind?",
    audience: "Audience", everyone: "Everyone on campus", department: "My department only",
    friendsOnly: "Friends only", addMedia: "Add Media (Optional)", publishPost: "Publish Post",
    cancel: "Cancel", characters: "characters",
    // Stories
    story: "Story", viewStory: "View Story", liveNow: "LIVE",
    // Profile
    editProfile: "Edit Profile", connections: "Connections", followers: "Followers",
    following2: "Following", posts: "Posts", media: "Media", saved: "Saved", settings: "Settings",
    about: "About", saveChanges: "Save Changes", academicField: "Academic Field",
    interests: "Interests", bio: "Bio", draftWithAI: "Draft with AI",
    // Connections
    myConnections: "My Connections", addFriend: "Add Friend", findPeople: "Find People",
    searchPeople: "Search people…", sendRequest: "Connect", pending: "Pending",
    connected: "Connected", message: "Message", mutualConnections: "mutual connections",
    // Groups
    campusGroups: "Campus Groups", createGroup: "Create Group", joinGroup: "Join",
    joined: "Joined", members: "members", searchGroups: "Search groups…",
    myGroups: "My Groups", discover: "Discover", groupName: "Group Name",
    groupDescription: "Description", groupType: "Type", publicGroup: "Public", privateGroup: "Private",
    // Search
    searchPlaceholder: "Search people, groups, posts…", people: "People", results: "Results",
    noResults: "No results found", tryDifferent: "Try a different search term",
    // Settings
    appearance: "Appearance", theme: "Theme", language: "Language", chooseTheme: "Choose your theme",
    chooseLanguage: "Choose language", notifications: "Notifications", privacy: "Privacy",
    account: "Account", dangerZone: "Danger Zone", deleteAccount: "Delete Account",
    lightMode: "Light Mode", darkMode: "Dark Mode",
    // Support
    submitTicket: "Submit a Ticket", myTickets: "My Tickets", category: "Category",
    subject: "Subject", details: "Details", submit: "Submit Ticket",
    // Auth
    signIn: "Sign In", signUp: "Sign Up", email: "Email", password: "Password",
    forgotPassword: "Forgot password?", joinCampus: "Join Your Campus",
    // General
    loading: "Loading", online: "Online", verified: "Verified", anonymous: "Anonymous",
    showIdentity: "Show Identity", postAnonymously: "Post Anonymously",
    viewAll: "View all", showMore: "Show more", close: "Close", done: "Done",
    back: "Back", next: "Next", skip: "Skip for now", enterDash: "Enter Dash",
  },
  fr: {
    // Nav
    feed: "Fil", events: "Événements", market: "Marché", support: "Support", profile: "Profil",
    groups: "Groupes", search: "Rechercher", admin: "Admin",
    // Feed
    campusFeed: "Fil du Campus", following: "Abonnements", trending: "Tendances", peek: "Voir (Autres Universités)",
    createPost: "Créer un post", addStory: "Ajouter une story", officialAnnouncements: "Annonces Officielles",
    allCaughtUp: "Vous êtes à jour",
    // Post actions
    upvote: "Voter pour", downvote: "Voter contre", comment: "Commenter", share: "Partager", save: "Enregistrer",
    unsave: "Retirer", report: "Signaler", repost: "Republier", repostWithThoughts: "Republier avec commentaire",
    shareVia: "Partager via…", copyLink: "Copier le lien", shareWhatsApp: "Partager sur WhatsApp",
    shareInstantly: "Partager instantanément", postShared: "Post partagé !", linkCopied: "Lien copié !",
    aiSummary: "Résumé IA", analyzing: "Analyse…", aiInsight: "Aperçu IA",
    writeComment: "Écrire un commentaire…", like: "J'aime", reply: "Répondre",
    // Create post
    shareWithCampus: "Partager avec le Campus", whatsOnMind: "Quoi de neuf ?",
    audience: "Audience", everyone: "Tout le campus", department: "Mon département seulement",
    friendsOnly: "Amis seulement", addMedia: "Ajouter un média (Optionnel)", publishPost: "Publier",
    cancel: "Annuler", characters: "caractères",
    // Stories
    story: "Story", viewStory: "Voir la story", liveNow: "EN DIRECT",
    // Profile
    editProfile: "Modifier le profil", connections: "Connexions", followers: "Abonnés",
    following2: "Abonnements", posts: "Posts", media: "Médias", saved: "Enregistrés", settings: "Paramètres",
    about: "À propos", saveChanges: "Enregistrer", academicField: "Domaine académique",
    interests: "Intérêts", bio: "Bio", draftWithAI: "Rédiger avec l'IA",
    // Connections
    myConnections: "Mes Connexions", addFriend: "Ajouter un ami", findPeople: "Trouver des personnes",
    searchPeople: "Rechercher des personnes…", sendRequest: "Connecter", pending: "En attente",
    connected: "Connecté", message: "Message", mutualConnections: "connexions en commun",
    // Groups
    campusGroups: "Groupes du Campus", createGroup: "Créer un groupe", joinGroup: "Rejoindre",
    joined: "Rejoint", members: "membres", searchGroups: "Rechercher des groupes…",
    myGroups: "Mes Groupes", discover: "Découvrir", groupName: "Nom du groupe",
    groupDescription: "Description", groupType: "Type", publicGroup: "Public", privateGroup: "Privé",
    // Search
    searchPlaceholder: "Rechercher personnes, groupes, posts…", people: "Personnes", results: "Résultats",
    noResults: "Aucun résultat", tryDifferent: "Essayez un autre terme de recherche",
    // Settings
    appearance: "Apparence", theme: "Thème", language: "Langue", chooseTheme: "Choisir votre thème",
    chooseLanguage: "Choisir la langue", notifications: "Notifications", privacy: "Confidentialité",
    account: "Compte", dangerZone: "Zone dangereuse", deleteAccount: "Supprimer le compte",
    lightMode: "Mode clair", darkMode: "Mode sombre",
    // Support
    submitTicket: "Soumettre un ticket", myTickets: "Mes tickets", category: "Catégorie",
    subject: "Sujet", details: "Détails", submit: "Soumettre",
    // Auth
    signIn: "Se connecter", signUp: "S'inscrire", email: "Email", password: "Mot de passe",
    forgotPassword: "Mot de passe oublié ?", joinCampus: "Rejoindre votre campus",
    // General
    loading: "Chargement", online: "En ligne", verified: "Vérifié", anonymous: "Anonyme",
    showIdentity: "Afficher l'identité", postAnonymously: "Poster anonymement",
    viewAll: "Voir tout", showMore: "Voir plus", close: "Fermer", done: "Terminé",
    back: "Retour", next: "Suivant", skip: "Passer pour l'instant", enterDash: "Entrer dans Dash",
  },
} as const;

type TranslationKey = keyof typeof translations.en;

interface I18nContextType {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (key: TranslationKey) => string;
}

const I18nContext = createContext<I18nContextType>({
  lang: "en",
  setLang: () => {},
  t: (k) => k,
});

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>("en");

  useEffect(() => {
    const stored = localStorage.getItem("dash-lang") as Lang | null;
    if (stored === "en" || stored === "fr") setLangState(stored);
  }, []);

  const setLang = (l: Lang) => {
    setLangState(l);
    localStorage.setItem("dash-lang", l);
  };

  const t = (key: TranslationKey): string => translations[lang][key] ?? translations.en[key] ?? key;

  return <I18nContext.Provider value={{ lang, setLang, t }}>{children}</I18nContext.Provider>;
}

export const useI18n = () => useContext(I18nContext);
