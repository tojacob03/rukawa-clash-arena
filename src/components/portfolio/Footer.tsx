import { Link } from "react-router-dom";
import { Mail, Crown, Linkedin, X } from "lucide-react";
import DiscordIcon from "@/components/icons/DiscordIcon";
import Terminal from "@/components/portfolio/Terminal";
import { useToast } from "@/hooks/use-toast";

const Footer = () => {
  const currentYear = new Date().getFullYear();
  const { toast } = useToast();

  const handleCopyDiscord = async (username: string) => {
    try {
      await navigator.clipboard.writeText(username);
      toast({
        title: "Copied!",
        description: `Discord username "${username}" copied to clipboard.`,
      });
    } catch {
      toast({
        title: "Couldn't copy",
        description: `Copy it manually: ${username}`,
        variant: "destructive",
      });
    }
  };

  return (
    <footer className="py-12 px-6 bg-secondary/30 border-t border-border/50">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row items-center justify-between">
          <div className="flex items-center gap-3 mb-6 md:mb-0">
            <div className="p-2 gradient-primary rounded-lg">
              <Crown className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
              <h3 className="text-xl font-bold gradient-primary bg-clip-text text-transparent">Rukawa</h3>
              <p className="text-sm text-muted-foreground">Clash Royale analyst · Solo CRL</p>
            </div>
          </div>

          <div className="flex items-center gap-4 mb-6 md:mb-0">
            <a
              href="mailto:to_jacob@me.com"
              className="p-3 rounded-lg bg-secondary/50 text-clash-blue hover:bg-secondary transition-colors"
              aria-label="Email"
            >
              <Mail className="w-5 h-5" />
            </a>
            <a
              href="https://www.linkedin.com/in/till-oscar-jacob-846403358"
              className="p-3 rounded-lg bg-secondary/50 text-foreground hover:bg-secondary transition-colors"
              aria-label="LinkedIn"
              rel="noopener noreferrer"
            >
              <Linkedin className="w-5 h-5" />
            </a>
            <button
              type="button"
              onClick={() => handleCopyDiscord("rukawa03")}
              className="p-3 rounded-lg bg-secondary/50 text-clash-purple hover:bg-secondary transition-colors cursor-pointer"
              aria-label="Copy Discord username"
              title="Discord: rukawa03"
            >
              <DiscordIcon className="w-5 h-5" />
            </button>
            <a
              href="https://twitter.com/RukawaAnalyst"
              className="p-3 rounded-lg bg-secondary/50 text-clash-gold hover:bg-secondary transition-colors"
              aria-label="Twitter/X"
              rel="noopener noreferrer"
            >
              <X className="w-5 h-5" />
            </a>
          </div>

          <div className="text-center md:text-right">
            <p className="text-sm text-muted-foreground">© {currentYear} Rukawa. All rights reserved.</p>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-border/40 space-y-2 text-center md:text-left">
          <p className="text-xs leading-relaxed text-muted-foreground">
            This material is unofficial and is not endorsed by Supercell. For more information see{" "}
            <a
              href="https://www.supercell.com/fan-content-policy"
              className="underline underline-offset-2 hover:text-foreground"
              target="_blank"
              rel="noopener noreferrer"
            >
              Supercell&apos;s Fan Content Policy
            </a>
            .
          </p>
          <p className="text-xs text-muted-foreground">
            <Link to="/impressum" className="underline underline-offset-2 hover:text-foreground">
              Impressum
            </Link>
            <span className="mx-2 text-muted-foreground/50">·</span>
            <Link to="/datenschutz" className="underline underline-offset-2 hover:text-foreground">
              Datenschutz / Privacy
            </Link>
          </p>
        </div>

        <Terminal />
      </div>
    </footer>
  );
};

export default Footer;
