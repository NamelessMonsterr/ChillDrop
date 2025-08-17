import { useTheme } from "./theme-provider";
import { Moon, Sun, Menu, Cloud } from "lucide-react";
import { Button } from "@/components/ui/button";

export function Navbar() {
  const { theme, setTheme } = useTheme();

  return (
    <nav className="relative z-50 glass rounded-2xl mx-4 mt-4" data-testid="navbar">
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3" data-testid="logo-section">
            <div className="relative">
              <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-xl flex items-center justify-center shadow-lg">
                <Cloud className="text-white text-lg" />
                <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-blue-400 rounded-full flex items-center justify-center">
                  <div className="w-2 h-2 bg-white rounded-full" />
                </div>
              </div>
            </div>
            <span className="text-2xl font-bold bg-gradient-to-r from-primary-600 to-secondary-500 bg-clip-text text-transparent">
              ChillDrop
            </span>
          </div>
          
          <div className="hidden md:flex items-center space-x-8">
            <a 
              href="#features" 
              className="text-gray-700 dark:text-gray-300 hover:text-primary-600 transition-colors"
              data-testid="link-features"
            >
              Features
            </a>
            <a 
              href="#how-it-works" 
              className="text-gray-700 dark:text-gray-300 hover:text-primary-600 transition-colors"
              data-testid="link-how-it-works"
            >
              How It Works
            </a>
            <a 
              href="#contact" 
              className="text-gray-700 dark:text-gray-300 hover:text-primary-600 transition-colors"
              data-testid="link-contact"
            >
              Contact
            </a>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setTheme(theme === "light" ? "dark" : "light")}
              className="glass hover:bg-white/20 transition-all"
              data-testid="button-theme-toggle"
            >
              {theme === "light" ? (
                <Moon className="h-5 w-5 text-gray-700" />
              ) : (
                <Sun className="h-5 w-5 text-yellow-400" />
              )}
            </Button>
          </div>
          
          <Button 
            variant="ghost" 
            size="icon" 
            className="md:hidden glass"
            data-testid="button-mobile-menu"
          >
            <Menu className="h-5 w-5 text-gray-700 dark:text-gray-300" />
          </Button>
        </div>
      </div>
    </nav>
  );
}
