import { Link } from "react-router-dom";
import Terminal from "@/components/portfolio/Terminal";
import { useToast } from "@/hooks/use-toast";

const Footer = () => {
  const currentYear = new Date().getFullYear();
  const { toast } = useToast();

  const handleCopyDiscord = async (username: string) => {
    try {
      await navigator.clipboard.writeText(username);
      toast({
        title: "Copied",
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
    <footer className="border-t border-border/60 px-5 py-12 sm:px-6">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-col gap-8 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-lg font-semibold text-foreground">Rukawa</p>
            <p className="text-sm text-muted-foreground">Till Oscar Jacob · Clash Royale analyst · Solo CRL</p>
          </div>
          <nav aria-label="Elsewhere" className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
            <a href="mailto:to_jacob@me.com" className="text-muted-foreground transition-colors hover:text-clash-gold">
              Email
            </a>
            <a
              href="https://www.linkedin.com/in/till-oscar-jacob-846403358"
              rel="noopener noreferrer"
              className="text-muted-foreground transition-colors hover:text-clash-gold"
            >
              LinkedIn
            </a>
            <a
              href="https://twitter.com/RukawaAnalyst"
              rel="noopener noreferrer"
              className="text-muted-foreground transition-colors hover:text-clash-gold"
            >
              X
            </a>
            <button
              type="button"
              onClick={() => handleCopyDiscord("rukawa03")}
              className="text-muted-foreground transition-colors hover:text-clash-gold"
              title="Copy Discord username"
            >
              Discord
            </button>
            <a
              href="https://github.com/tojacob03/rukawa-clash-arena"
              rel="noopener noreferrer"
              className="text-muted-foreground transition-colors hover:text-clash-gold"
            >
              Source
            </a>
          </nav>
        </div>

        <div className="mt-8 pt-6 border-t border-border/40 space-y-2 text-center md:text-left">
          <p className="text-xs text-muted-foreground">
            Languages: German (native) · English C2 · Spanish B1 · Russian A2 · Arabic A2
          </p>
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
            © {currentYear} Till Oscar Jacob
            <span className="mx-2 text-muted-foreground/50">·</span>
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
