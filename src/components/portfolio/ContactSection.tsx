import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Mail, MessageCircle, Twitter, Send } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";

const ContactSection = () => {
  const { t } = useTranslation();
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
      const { error } = await supabase
        .from('contact_submissions')
        .insert([{
          name: formData.name,
          email: formData.email,
          message: formData.message
        }]);

      if (error) {
        throw error;
      }

      toast({
        title: t('contact.messageSent'),
        description: t('contact.messageSuccess'),
      });
      setFormData({ name: "", email: "", message: "" });
    } catch (error) {
      console.error('Error submitting form:', error);
      toast({
        title: t('contact.error'),
        description: t('contact.errorMessage'),
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const contactMethods = [
    {
      icon: Mail,
      label: t('contact.methods.email'),
      value: "to_jacob@me.com",
      href: "mailto:to_jacob@me.com",
      color: "text-clash-blue"
    },
    {
      icon: MessageCircle,
      label: t('contact.methods.discord'),
      value: "rukawa03",
      href: "#",
      color: "text-clash-purple"
    },
    {
      icon: Twitter,
      label: t('contact.methods.twitter'),
      value: "RukawaAnalyst",
      href: "https://twitter.com/RukawaAnalyst",
      color: "text-clash-gold"
    }
  ];

  return (
    <section id="contact" className="py-20 px-6">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-6 gradient-primary bg-clip-text text-transparent">
            {t('contact.title')}
          </h2>
          <div className="w-24 h-1 gradient-accent mx-auto rounded-full"></div>
          <p className="text-lg text-muted-foreground mt-6 max-w-2xl mx-auto">
            {t('contact.subtitle')}
          </p>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Contact Methods */}
          <div className="space-y-6">
            <h3 className="text-2xl font-bold text-foreground mb-6">{t('contact.methodsTitle')}</h3>
            {contactMethods.map((method, index) => (
              <Card 
                key={method.label}
                className="gradient-card shadow-card border-border/50 p-6 hover:shadow-glow transition-all duration-300 group"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <a 
                  href={method.href}
                  className="flex items-center gap-4 group-hover:scale-105 transition-transform"
                >
                  <div className={`p-3 rounded-lg bg-secondary/50 ${method.color} group-hover:animate-glow`}>
                    <method.icon className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-foreground">{method.label}</h4>
                    <p className="text-muted-foreground">{method.value}</p>
                  </div>
                </a>
              </Card>
            ))}
          </div>
          
          {/* Contact Form */}
          <Card className="gradient-card shadow-card border-border/50 p-8">
            <h3 className="text-2xl font-bold text-foreground mb-6">{t('contact.formTitle')}</h3>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="name">{t('contact.form.name')}</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  required
                  className="bg-secondary/50 border-border focus:border-primary"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="email">{t('contact.form.email')}</Label>
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
                <Label htmlFor="message">{t('contact.form.message')}</Label>
                <Textarea
                  id="message"
                  rows={5}
                  value={formData.message}
                  onChange={(e) => setFormData(prev => ({ ...prev, message: e.target.value }))}
                  required
                  className="bg-secondary/50 border-border focus:border-primary resize-none"
                  placeholder={t('contact.form.messagePlaceholder')}
                />
              </div>
              
              <Button type="submit" variant="hero" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? t('contact.form.sending') : t('contact.form.send')}
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