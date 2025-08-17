import { useState } from "react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { Plus, LogIn, Clock, Shield, Lock, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Navbar } from "@/components/navbar";
import { CreateRoomModal } from "@/components/create-room-modal";
import { JoinRoomModal } from "@/components/join-room-modal";
import { PasswordModal } from "@/components/password-modal";

export default function Landing() {
  const [, setLocation] = useLocation();
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [joinModalOpen, setJoinModalOpen] = useState(false);
  const [passwordModalOpen, setPasswordModalOpen] = useState(false);
  const [pendingRoomId, setPendingRoomId] = useState<string>("");

  const handleRoomCreated = (roomId: string) => {
    setLocation(`/room/${roomId}`);
  };

  const handleJoinRoom = (roomId: string) => {
    // Check if room requires password
    fetch(`/api/rooms/${roomId}`)
      .then(res => res.json())
      .then(room => {
        if (room.hasPassword) {
          setPendingRoomId(roomId);
          setPasswordModalOpen(true);
        } else {
          setLocation(`/room/${roomId}`);
        }
      })
      .catch(() => {
        // Room not found or error - still try to navigate
        setLocation(`/room/${roomId}`);
      });
  };

  const handlePasswordValidated = () => {
    setLocation(`/room/${pendingRoomId}`);
  };

  const features = [
    {
      icon: Clock,
      title: "Auto-Expiry",
      description: "Rooms and files automatically delete after 1h, 6h, 12h, or 24h. No traces left behind.",
      gradient: "from-primary-500 to-primary-600",
    },
    {
      icon: Shield,
      title: "Password Protection",
      description: "Optional room passwords with bcrypt encryption for an extra layer of security.",
      gradient: "from-secondary-500 to-red-500",
    },
    {
      icon: Lock,
      title: "Zero Knowledge",
      description: "Client-side encryption means your data is encrypted before it ever leaves your device.",
      gradient: "from-blue-500 to-indigo-600",
    },
    {
      icon: MessageCircle,
      title: "Real-time Chat",
      description: "Instant messaging with typing indicators, emoji picker, and file sharing in chat.",
      gradient: "from-green-500 to-teal-600",
    },
  ];

  const steps = [
    {
      number: 1,
      title: "Create Room",
      description: "Set up a temporary room with custom expiry and optional password",
      gradient: "from-primary-500 to-primary-600",
    },
    {
      number: 2,
      title: "Upload & Chat",
      description: "Drag & drop files up to 250MB and chat in real-time with participants",
      gradient: "from-secondary-500 to-red-500",
    },
    {
      number: 3,
      title: "Share Link",
      description: "Send the room link or QR code to others for instant access",
      gradient: "from-blue-500 to-indigo-600",
    },
    {
      number: 4,
      title: "Auto-Delete",
      description: "Everything automatically expires and deletes after the chosen time",
      gradient: "from-green-500 to-teal-600",
    },
  ];

  return (
    <div className="min-h-screen" data-testid="landing-page">
      {/* Background Gradient */}
      <div className="fixed inset-0 gradient-mesh opacity-30 dark:opacity-20"></div>
      <div className="fixed inset-0 bg-white/30 dark:bg-black/30"></div>
      
      <Navbar />
      
      <div className="relative z-10">
        {/* Hero Section */}
        <section className="container mx-auto px-6 py-20">
          <div className="text-center max-w-4xl mx-auto">
            <motion.h1 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-6xl md:text-7xl font-black mb-6 bg-gradient-to-r from-gray-900 via-primary-600 to-secondary-500 bg-clip-text text-transparent dark:from-white dark:via-primary-400"
              data-testid="hero-title"
            >
              Share Files.<br />Chat Securely.<br />Auto-Delete.
            </motion.h1>
            
            <motion.p 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-xl md:text-2xl text-gray-600 dark:text-gray-300 mb-12 max-w-3xl mx-auto"
              data-testid="hero-description"
            >
              Create temporary rooms for secure file sharing and real-time chat. Everything auto-expires when you're done. Zero knowledge, maximum privacy.
            </motion.p>
            
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="flex flex-col sm:flex-row gap-6 justify-center items-center"
            >
              <Button
                onClick={() => setCreateModalOpen(true)}
                className="group relative px-8 py-4 bg-gradient-to-r from-primary-500 to-primary-600 text-white text-lg hover-lift hover:animate-glow shadow-2xl"
                data-testid="button-create-room"
              >
                <Plus className="mr-2 h-5 w-5" />
                Create Room
                <div className="absolute inset-0 bg-white/20 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
              </Button>
              
              <Button
                onClick={() => setJoinModalOpen(true)}
                variant="outline"
                className="px-8 py-4 glass text-gray-700 dark:text-gray-300 text-lg hover-lift border-2 border-primary-500/30"
                data-testid="button-join-room"
              >
                <LogIn className="mr-2 h-5 w-5" />
                Join Room
              </Button>
            </motion.div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="container mx-auto px-6 py-20">
          <div className="text-center mb-16">
            <motion.h2 
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-4xl md:text-5xl font-bold mb-6 text-gray-900 dark:text-white"
              data-testid="features-title"
            >
              Why Choose ChillDrop?
            </motion.h2>
            <motion.p 
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto"
            >
              Built for privacy, designed for simplicity. Share with confidence.
            </motion.p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="glass rounded-3xl p-8 hover-lift"
                data-testid={`feature-${feature.title.toLowerCase().replace(/\s+/g, '-')}`}
              >
                <div className={`w-16 h-16 bg-gradient-to-br ${feature.gradient} rounded-2xl flex items-center justify-center mb-6 mx-auto`}>
                  <feature.icon className="text-white text-2xl" />
                </div>
                <h3 className="text-xl font-bold mb-4 text-gray-900 dark:text-white text-center">
                  {feature.title}
                </h3>
                <p className="text-gray-600 dark:text-gray-300 text-center">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>
        </section>

        {/* How It Works */}
        <section id="how-it-works" className="container mx-auto px-6 py-20">
          <div className="text-center mb-16">
            <motion.h2 
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-4xl md:text-5xl font-bold mb-6 text-gray-900 dark:text-white"
              data-testid="how-it-works-title"
            >
              How It Works
            </motion.h2>
            <motion.p 
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto"
            >
              Simple steps for secure sharing
            </motion.p>
          </div>
          
          <div className="max-w-4xl mx-auto">
            <div className="grid md:grid-cols-4 gap-8">
              {steps.map((step, index) => (
                <motion.div
                  key={step.number}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  className="text-center"
                  data-testid={`step-${step.number}`}
                >
                  <div className={`w-20 h-20 bg-gradient-to-br ${step.gradient} rounded-full flex items-center justify-center mx-auto mb-6 text-white text-2xl font-bold`}>
                    {step.number}
                  </div>
                  <h3 className="text-lg font-semibold mb-3 text-gray-900 dark:text-white">
                    {step.title}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300">
                    {step.description}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="glass mx-4 mb-4 rounded-2xl" data-testid="footer">
          <div className="container mx-auto px-6 py-8">
            <div className="flex flex-col md:flex-row justify-between items-center">
              <div className="flex items-center space-x-3 mb-4 md:mb-0">
                <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-lg flex items-center justify-center">
                  <div className="w-4 h-4 bg-white rounded-sm"></div>
                </div>
                <span className="text-lg font-bold text-gray-900 dark:text-white">ChillDrop</span>
              </div>
              
              <div className="flex space-x-6 mb-4 md:mb-0">
                <a href="#" className="text-gray-600 dark:text-gray-300 hover:text-primary-600 transition-colors">
                  Privacy
                </a>
                <a href="#" className="text-gray-600 dark:text-gray-300 hover:text-primary-600 transition-colors">
                  Terms
                </a>
              </div>
              
              <div className="text-gray-600 dark:text-gray-300">
                Made By Hammad
              </div>
            </div>
          </div>
        </footer>
      </div>

      {/* Modals */}
      <CreateRoomModal 
        open={createModalOpen} 
        onOpenChange={setCreateModalOpen}
        onRoomCreated={handleRoomCreated}
      />
      
      <JoinRoomModal 
        open={joinModalOpen} 
        onOpenChange={setJoinModalOpen}
        onJoinRoom={handleJoinRoom}
      />
      
      <PasswordModal
        open={passwordModalOpen}
        onOpenChange={setPasswordModalOpen}
        roomId={pendingRoomId}
        onPasswordValidated={handlePasswordValidated}
      />
    </div>
  );
}
