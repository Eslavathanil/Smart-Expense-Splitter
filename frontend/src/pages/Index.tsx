import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";
import { 
  Users, 
  Receipt, 
  PieChart, 
  ArrowRight, 
  Wallet,
  Zap,
  Shield,
  Check
} from "lucide-react";

const Index = () => {
  return (
    <div className="min-h-screen gradient-hero">
      {/* Navigation */}
      <nav className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 gradient-primary rounded-xl flex items-center justify-center">
              <Wallet className="w-6 h-6 text-primary-foreground" />
            </div>
            <span className="text-2xl font-bold text-foreground">SplitSmart</span>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Link to="/login">
              <Button variant="ghost">Log in</Button>
            </Link>
            <Link to="/signup">
              <Button variant="default">Sign up</Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="container mx-auto px-4 pt-16 pb-24">
        <div className="max-w-4xl mx-auto text-center">
          <div className="opacity-0 animate-fade-up">
            <span className="inline-block px-4 py-2 rounded-full bg-accent text-accent-foreground text-sm font-medium mb-6">
              Simplify group expenses
            </span>
          </div>
          
          <h1 className="opacity-0 animate-fade-up stagger-1 text-5xl md:text-6xl lg:text-7xl font-bold text-foreground mb-6 leading-tight">
            Split bills
            <span className="text-gradient"> effortlessly</span>
            <br />with friends
          </h1>
          
          <p className="opacity-0 animate-fade-up stagger-2 text-xl text-muted-foreground mb-10 max-w-2xl mx-auto">
            Track shared expenses, calculate who owes whom, and settle debts with minimal transactions. 
            Perfect for trips, roommates, and group events.
          </p>
          
          <div className="opacity-0 animate-fade-up stagger-3 flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/signup">
              <Button variant="hero" size="xl">
                Get started free
                <ArrowRight className="w-5 h-5" />
              </Button>
            </Link>
            <Link to="/login">
              <Button variant="outline" size="xl">
                Log in to your account
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Everything you need to manage group expenses
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Powerful features designed to make expense splitting simple and transparent
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          <FeatureCard
            icon={<Users className="w-6 h-6" />}
            title="Group Management"
            description="Create groups for trips, households, or events. Add members and start tracking expenses together."
            delay="stagger-1"
          />
          <FeatureCard
            icon={<Receipt className="w-6 h-6" />}
            title="Smart Splitting"
            description="Split expenses equally, by percentage, or custom amounts. Flexible options for any situation."
            delay="stagger-2"
          />
          <FeatureCard
            icon={<PieChart className="w-6 h-6" />}
            title="Visual Analytics"
            description="See spending breakdowns by category with beautiful charts. Export reports as CSV anytime."
            delay="stagger-3"
          />
        </div>
      </section>

      {/* Benefits Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="max-w-5xl mx-auto bg-card rounded-3xl shadow-card-hover p-8 md:p-12">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h3 className="text-3xl font-bold text-foreground mb-6">
                Why choose SplitSmart?
              </h3>
              <ul className="space-y-4">
                <BenefitItem icon={<Zap />} text="Instant calculations - no more spreadsheets" />
                <BenefitItem icon={<Shield />} text="Secure and private group data" />
                <BenefitItem icon={<Users />} text="Works for any group size" />
                <BenefitItem icon={<Receipt />} text="Minimize settlement transactions" />
              </ul>
            </div>
            <div className="relative">
              <div className="bg-accent rounded-2xl p-6 transform rotate-2 hover:rotate-0 transition-transform duration-300">
                <div className="bg-card rounded-xl p-6 shadow-lg">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-full gradient-primary" />
                    <div>
                      <div className="font-semibold">Weekend Trip</div>
                      <div className="text-sm text-muted-foreground">4 members</div>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span>Total expenses</span>
                      <span className="font-semibold">$450.00</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Your share</span>
                      <span className="font-semibold text-primary">$112.50</span>
                    </div>
                    <div className="h-2 bg-secondary rounded-full overflow-hidden">
                      <div className="h-full w-3/4 gradient-primary rounded-full" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Ready to simplify your expenses?
          </h2>
          <p className="text-lg text-muted-foreground mb-8">
            Join thousands of groups already using SplitSmart
          </p>
          <Link to="/signup">
            <Button variant="hero" size="xl">
              Create your free account
              <ArrowRight className="w-5 h-5" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border">
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 gradient-primary rounded-lg flex items-center justify-center">
                <Wallet className="w-4 h-4 text-primary-foreground" />
              </div>
              <span className="text-lg font-bold text-foreground">SplitSmart</span>
            </div>
            <p className="text-sm text-muted-foreground">
              © 2025 SplitSmart. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

const FeatureCard = ({ 
  icon, 
  title, 
  description, 
  delay 
}: { 
  icon: React.ReactNode; 
  title: string; 
  description: string;
  delay: string;
}) => (
  <div className={`opacity-0 animate-fade-up ${delay} bg-card rounded-2xl p-6 text-center group cursor-default`}>
    <div className="w-14 h-14 mx-auto mb-4 gradient-primary rounded-2xl flex items-center justify-center text-primary-foreground group-hover:scale-110 transition-transform duration-300">
      {icon}
    </div>
    <h3 className="text-xl font-semibold text-foreground mb-2">{title}</h3>
    <p className="text-muted-foreground">{description}</p>
  </div>
);

const BenefitItem = ({ icon, text }: { icon: React.ReactNode; text: string }) => (
  <li className="flex items-center gap-3">
    <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center text-primary">
      {icon}
    </div>
    <span className="text-foreground">{text}</span>
  </li>
);

export default Index;
