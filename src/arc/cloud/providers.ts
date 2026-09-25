// Display names of the sign-in providers.

export const PROVIDER_NAME: Record<string, string> = {
  google: "Google",
  apple: "Apple",
  discord: "Discord",
  github: "GitHub",
  facebook: "Facebook",
  azure: "Microsoft",
  twitter: "X",
  twitch: "Twitch",
  spotify: "Spotify",
  linkedin_oidc: "LinkedIn",
  slack_oidc: "Slack",
  gitlab: "GitLab",
  bitbucket: "Bitbucket",
  notion: "Notion",
  zoom: "Zoom",
  figma: "Figma",
  kakao: "Kakao",
  snapchat: "Snapchat",
  keycloak: "Keycloak",
  workos: "WorkOS",
  email: "E-Mail",
  phone: "Telefon",
};

export const providerName = (p: string) => PROVIDER_NAME[p] ?? p.charAt(0).toUpperCase() + p.slice(1);
