import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Mail, MessageCircle, Twitter, Send, Linkedin } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const ContactSection = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    message: ""
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Get client IP for rate limiting (best effort)
      const ipResponse = await fetch('https://api.ipify.org?format=json').catch(() => null);
      const ipData = ipResponse ? await ipResponse.json() : null;

      const { data, error } = await supabase.rpc('submit_contact_form_secure', {
        name_param: formData.name,
        email_param: formData.email,
        message_param: formData.message,
        ip_address_param: ipData?.ip || '0.0.0.0'
      });

      if (error) {
        throw error;
      }

      toast({
        title: "Message Sent!",
        description: "Thank you for your message. I'll get back to you soon.",
      });
      setFormData({ name: "", email: "", message: "" });
    } catch (error: any) {
      console.error('Error submitting form:', error);
      
      // Handle rate limiting specifically
      if (error.message?.includes('Rate limit exceeded')) {
        toast({
          title: "Rate Limit Exceeded",
          description: "Too many submissions. Please wait an hour before sending another message.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Error",
          description: "There was an error sending your message. Please try again.",
          variant: "destructive",
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const contactMethods: {
    icon: typeof Mail;
    label: string;
    value: string;
    href?: string;
    color: string;
  }[] = [
    {
      icon: Mail,
      label: "Email",
      value: "to_jacob@me.com",
      href: "mailto:to_jacob@me.com",
      color: "text-clash-blue"
    },
    {
      icon: Linkedin,
      label: "LinkedIn",
      value: "Till Oscar Jacob",
      href: "https://www.linkedin.com/in/till-oscar-jacob-846403358",
      color: "text-foreground"
    },
    {
      icon: MessageCircle,
      label: "Discord",
      value: "rukawa03",
      href: undefined,
      color: "text-clash-purple"
    },
    {
      icon: Twitter,
      label: "Twitter/X",
      value: "RukawaAnalyst",
      href: "https://twitter.com/RukawaAnalyst",
      color: "text-clash-gold"
    }
  ];

  return (
    <section id="contact" className="scroll-mt-20 py-14 sm:py-20 px-5 sm:px-6">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-10 sm:mb-16">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4 sm:mb-6 gradient-primary bg-clip-text text-transparent">
            Get In Touch
          </h2>
          <div className="w-24 h-1 gradient-accent mx-auto rounded-full"></div>
          <p className="text-lg text-muted-foreground mt-6 max-w-2xl mx-auto">
            Recruiter, org, or player — if you want to talk about Solo CRL analysis or the tooling behind it.
          </p>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Contact Methods */}
          <div className="space-y-6">
            <h3 className="text-2xl font-bold text-foreground mb-6">Contact Methods</h3>
            {contactMethods.map((method, index) => (
              <Card 
                key={method.label}
                className="gradient-card shadow-card border-border/50 p-6 hover:shadow-glow transition-all duration-300 group"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                {method.href ? (
                  <a
                    href={method.href}
                    className="flex items-center gap-4"
                    target={method.href.startsWith("http") ? "_blank" : undefined}
                    rel={method.href.startsWith("http") ? "noreferrer" : undefined}
                  >
                    <div className={`p-3 rounded-lg bg-secondary/50 ${method.color}`}>
                      <method.icon className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-foreground">{method.label}</h4>
                      <p className="text-muted-foreground">{method.value}</p>
                    </div>
                  </a>
                ) : (
                  <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-lg bg-secondary/50 ${method.color}`}>
                      <method.icon className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-foreground">{method.label}</h4>
                      <p className="text-muted-foreground">{method.value}</p>
                    </div>
                  </div>
                )}
              </Card>
            ))}
          </div>
          
          {/* Contact Form */}
          <Card className="gradient-card shadow-card border-border/50 p-8">
            <h3 className="text-2xl font-bold text-foreground mb-6">Send a Message</h3>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  required
                  className="bg-secondary/50 border-border focus:border-primary"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  required
                  className="bg-secondary/50 border-border focus:border-primary"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="message">Message</Label>
                <Textarea
                  id="message"
                  rows={5}
                  value={formData.message}
                  onChange={(e) => setFormData(prev => ({ ...prev, message: e.target.value }))}
                  required
                  className="bg-secondary/50 border-border focus:border-primary resize-none"
                  placeholder="What you are looking for…"
                />
              </div>
              
              <Button type="submit" variant="hero" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? "Sending..." : "Send Message"}
                <Send className="w-4 h-4 ml-2" />
              </Button>
            </form>
          </Card>
        </div>
      </div>
    </section>
  );
};

export default ContactSection;