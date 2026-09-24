import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ArrowUpRight, Send, Copy, CalendarDays } from "lucide-react";
import SectionIntro from "@/components/portfolio/SectionIntro";
import { useState } from "react";
import { Link } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { getCalApi } from "@calcom/embed-react";
import { errorMessage } from "@/lib/errors";

const CAL_LINK = "tilloscar";
const CAL_NAMESPACE = "contact-section";

const ContactSection = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    message: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  // Cal.com is loaded only when the visitor actually clicks "Book a call".
  // Loading the embed script on mount would contact Cal.com (a US third
  // party) on every page view - privacy-wise that should be opt-in.
  const [calLoading, setCalLoading] = useState(false);
  const openCal = async () => {
    setCalLoading(true);
    try {
      const cal = await getCalApi({ namespace: CAL_NAMESPACE });
      cal("ui", {
        theme: "dark",
        styles: { branding: { brandColor: "#7539EF" } },
        hideEventTypeDetails: false,
        layout: "month_view",
      });
      cal("modal", { calLink: CAL_LINK, config: { layout: "month_view" } });
    } catch (err) {
      console.error("Cal.com failed to load:", err);
      toast({
        title: "Couldn't open the calendar",
        description: "Please use the contact form or email instead.",
        variant: "destructive",
      });
    } finally {
      setCalLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Get client IP for rate limiting (best effort)
      const ipResponse = await fetch("https://api.ipify.org?format=json").catch(() => null);
      const ipData = ipResponse ? await ipResponse.json() : null;

      const { data, error } = await supabase.rpc("submit_contact_form_secure", {
        name_param: formData.name,
        email_param: formData.email,
        message_param: formData.message,
        ip_address_param: ipData?.ip || "0.0.0.0",
      });

      if (error) {
        throw error;
      }

      toast({
        title: "Message sent",
        description: "Thanks – I’ll get back to you soon.",
      });
      setFormData({ name: "", email: "", message: "" });
    } catch (error: unknown) {
      console.error("Error submitting form:", error);

      // Handle rate limiting specifically
      if (errorMessage(error).includes("Rate limit exceeded")) {
        toast({
          title: "Too many messages",
          description: "Please wait an hour before sending another message.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Couldn’t send your message",
          description: "Please try again, or write an email instead.",
          variant: "destructive",
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

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

  const contactMethods: { label: string; value: string; href?: string; onClick?: () => void }[] = [
    { label: "Email", value: "to_jacob@me.com", href: "mailto:to_jacob@me.com" },
    { label: "LinkedIn", value: "Till Oscar Jacob", href: "https://www.linkedin.com/in/till-oscar-jacob-846403358" },
    { label: "Discord", value: "rukawa03", onClick: () => handleCopyDiscord("rukawa03") },
    { label: "X", value: "@RukawaAnalyst", href: "https://twitter.com/RukawaAnalyst" },
  ];

  const inputClass = "border-border bg-background/60 focus-visible:ring-clash-gold";

  return (
    <section id="contact" className="scroll-mt-14 px-5 py-20 sm:px-6 sm:py-28">
      <div className="mx-auto grid max-w-7xl gap-14 lg:grid-cols-12">
        <div className="lg:col-span-5">
          <SectionIntro
            eyebrow="Contact"
            title="Let’s talk about your next set."
            description="Player, team, recruiter or client – tell me what you are preparing for, or what you would like built."
          />

          <div className="mt-10 rounded-2xl border border-clash-gold/25 bg-clash-gold/[0.04] p-6">
            <p className="font-semibold text-foreground">Prefer to just talk?</p>
            <p className="mt-1 text-sm text-muted-foreground">Pick a slot directly – no back-and-forth over email.</p>
            <Button className="mt-5 w-full sm:w-auto" onClick={openCal} disabled={calLoading}>
              {calLoading ? "Loading…" : "Book a call"}
              <CalendarDays className="ml-2 h-4 w-4" />
            </Button>
            <p className="mt-3 text-xs text-muted-foreground/70">
              Opens the Cal.com scheduler (third-party service, see{" "}
              <Link to="/datenschutz" className="underline underline-offset-2 hover:text-foreground">
                privacy policy
              </Link>
              ).
            </p>
          </div>

          <ul className="mt-10 border-t border-border/60">
            {contactMethods.map((m) => {
              const inner = (
                <>
                  <span className="label-caps w-20 shrink-0 text-muted-foreground">{m.label}</span>
                  <span className="flex-1 truncate text-foreground">{m.value}</span>
                  {m.onClick ? (
                    <Copy className="h-4 w-4 text-muted-foreground transition-colors group-hover:text-clash-gold" />
                  ) : (
                    <ArrowUpRight className="h-4 w-4 text-muted-foreground transition-all group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-clash-gold" />
                  )}
                </>
              );
              const cls = "group flex w-full items-center gap-4 border-b border-border/60 py-4 text-left";
              return (
                <li key={m.label}>
                  {m.href ? (
                    <a href={m.href} className={cls} rel={m.href.startsWith("http") ? "noopener noreferrer" : undefined}>
                      {inner}
                    </a>
                  ) : (
                    <button type="button" onClick={m.onClick} className={cls} aria-label={`Copy ${m.label} username`}>
                      {inner}
                    </button>
                  )}
                </li>
              );
            })}
          </ul>
        </div>

        <Card className="self-start border-border/60 bg-card/60 p-6 sm:p-8 lg:col-span-7">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid gap-6 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                  required
                  className={inputClass}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
                  required
                  className={inputClass}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="message">Message</Label>
              <Textarea
                id="message"
                rows={7}
                value={formData.message}
                onChange={(e) => setFormData((prev) => ({ ...prev, message: e.target.value }))}
                required
                className={`${inputClass} resize-none`}
                placeholder="What are you preparing for?"
              />
            </div>

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? "Sending…" : "Send message"}
              <Send className="ml-2 h-4 w-4" />
            </Button>
            <p className="text-xs text-muted-foreground">
              Your name, email and message are stored to answer your request. Details in the{" "}
              <Link to="/datenschutz" className="underline underline-offset-2 hover:text-foreground">
                privacy policy
              </Link>{" "}
              (German).
            </p>
          </form>
        </Card>
      </div>
    </section>
  );
};

export default ContactSection;
