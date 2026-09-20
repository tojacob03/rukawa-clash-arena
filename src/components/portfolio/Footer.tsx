import { Mail, Crown, Linkedin, X } from "lucide-react";
import DiscordIcon from "@/components/icons/DiscordIcon";
import { useToast } from "@/hooks/use-toast";

const CONSOLE_COMMAND = "window.rukawa.help()";

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

  // The console easter egg needs to be findable without being advertised:
  // this reads as a small terminal flourish to most visitors, and as an
  // obvious invitation to anyone who'd open devtools in the first place.
  const handleCopyCommand = async () => {
    try {
      await navigator.clipboard.writeText(CONSOLE_COMMAND);
      toast({
        title: "Copied to clipboard",
        description: "Paste it into your browser console.",
      });
    } catch {
      toast({
        title: "Couldn't copy",
        description: `Run it yourself: ${CONSOLE_COMMAND}`,
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

        {/* Console easter egg entry point */}
        <div className="mt-10 pt-6 border-t border-border/40 flex justify-center">
          <button
            type="button"
            onClick={handleCopyCommand}
            title="Copy to clipboard"
            className="group font-mono text-xs text-muted-foreground/50 hover:text-muted-foreground transition-colors"
          >
            <span className="text-clash-gold/40 group-hover:text-clash-gold/70 transition-colors">
              rukawa@portfolio
            </span>
            <span className="text-muted-foreground/40">:~$</span>{" "}
            <span className="opacity-0 group-hover:opacity-100 transition-opacity">{CONSOLE_COMMAND}</span>
            <span className="inline-block w-[0.55em] h-[1em] translate-y-[0.15em] bg-current animate-caret ml-0.5 group-hover:hidden" />
          </button>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
