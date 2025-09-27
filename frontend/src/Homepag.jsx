import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Database, Layers, Zap, Globe, Play, Star } from "lucide-react";

// Utility function for joining class names
const cn = (...classes) => classes.filter(Boolean).join(" ");

// Main theme colors based on ocean palettes
const COLORS = {
  bgGradient: "bg-gradient-to-br from-[#0B3D91] via-[#009688] to-[#E0F7FA]",
  headerGradient: "bg-gradient-to-r from-[#0B3D91] via-[#00CED1] to-[#E0F7FA]/90",
  cardBg: "bg-white/30",
  cardBorder: "border-[#D6CDAF]",
  buttonOcean:
    "bg-gradient-to-r from-[#009688] to-[#00CED1] text-white hover:shadow-lg hover:from-[#00CED1] hover:to-[#009688]",
  buttonCoral: "bg-[#FF7675] text-white hover:bg-[#ffd6d6]",
  accent: "text-[#FFD700]",
  sand: "bg-[#D6CDAF]",
  driftwood: "bg-[#ECECEC]",
  paleBlue: "bg-[#E0F7FA]",
  highlight: "text-[#009688]",
};

// Styled Button
const Button = ({ className, variant = "default", size = "default", children, ...props }) => {
  const variantClasses = {
    default: "bg-[#0B3D91] text-white hover:bg-[#009688]",
    surface: "bg-white text-[#0B3D91] hover:bg-[#E0F7FA]",
    ocean: COLORS.buttonOcean,
    coral: COLORS.buttonCoral,
  };
  const sizeClasses = {
    default: "h-10 px-4 py-2",
    sm: "h-9 px-3",
    lg: "h-12 px-8 text-lg",
  };
  return (
    <button
      className={cn(
        "rounded-md font-medium transition-colors inline-flex items-center justify-center gap-2 shadow-lg",
        variantClasses[variant],
        sizeClasses[size],
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
};

const Card = ({ className, children, ...props }) => (
  <div
    className={cn(
      "rounded-xl border shadow-md backdrop-blur-sm",
      COLORS.cardBg,
      COLORS.cardBorder,
      className
    )}
    {...props}
  >
    {children}
  </div>
);

// Card content elements
const CardContent = ({ className, children, ...props }) => (
  <div className={cn("p-6", className)} {...props}>
    {children}
  </div>
);
const CardTitle = ({ className, children, ...props }) => (
  <h3 className={cn("text-lg font-semibold mb-2", COLORS.highlight, className)} {...props}>
    {children}
  </h3>
);
const CardDescription = ({ className, children, ...props }) => (
  <p className={cn("text-sm text-[#0B3D91]/90", className)} {...props}>
    {children}
  </p>
);

const Header = () => {
  const [dropdownOpen, setDropdownOpen] = useState(false);

  return (
    <header
      className={cn(
        "fixed top-0 w-full z-50 border-b shadow-md text-white",
        COLORS.headerGradient,
        COLORS.cardBorder
      )}
    >
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-white/30 rounded-lg flex items-center justify-center">
            <Database className="w-5 h-5 text-[#FFD700]" />
          </div>
          <h1 className="text-xl font-bold" style={{ color: "#FFD700" }}>
            AgroOcean
          </h1>
        </div>
        <nav className="hidden md:flex items-center gap-6 relative">
          <a href="#services" className="hover:text-[#FFD700] transition">
            Services
          </a>
          <a href="#oceans" className="hover:text-[#FFD700] transition">
            Oceans
          </a>
          <a href="#gallery" className="hover:text-[#FFD700] transition">
            Gallery
          </a>
          <a href="#reviews" className="hover:text-[#FFD700] transition">
            Reviews
          </a>

          {/* Dropdown Menu */}
          <div className="relative">
            <Button
              variant="coral"
              size="sm"
              onClick={() => setDropdownOpen(!dropdownOpen)}
            >
              More
            </Button>
            {dropdownOpen && (
              <div className="absolute right-0 mt-2 w-40 bg-white shadow-lg rounded-lg overflow-hidden z-50">
                <Link
                  to="/compare"
                  className="block px-4 py-2 text-[#0B3D91] hover:bg-[#E0F7FA] transition"
                  onClick={() => setDropdownOpen(false)}
                >
                  Compare
                </Link>
                <Link
                  to="/3d-profile"
                  className="block px-4 py-2 text-[#0B3D91] hover:bg-[#E0F7FA] transition"
                  onClick={() => setDropdownOpen(false)}
                >
                  3D Profile
                </Link>
                <Link
                  to="/chatbot"
                  className="block px-4 py-2 text-[#0B3D91] hover:bg-[#E0F7FA] transition"
                  onClick={() => setDropdownOpen(false)}
                >
                  Chatbot
                </Link>
              </div>
            )}
          </div>
        </nav>
      </div>
    </header>
  );
};

const Hero = () => (
  <section
    className={cn(
      "relative min-h-screen flex items-center justify-center mt-16 text-[#0B3D91]",
      COLORS.bgGradient
    )}
  >
    <div className="container mx-auto px-4 flex flex-col md:flex-row items-center gap-8">
      <div className="w-full md:w-1/2">
        <img
          src="/images/hero.jpg"
          alt="Project"
          className="rounded-xl shadow-lg w-full border-4 border-[#D6CDAF]/40"
        />
      </div>
      <div className="w-full md:w-1/2 space-y-6 text-center md:text-left">
        <h1 className={cn("text-4xl md:text-5xl font-bold", COLORS.accent)}>
          Explore Our Ocean Data Dashboard
        </h1>
        <p className="text-lg text-[#0B3D91]/80">
          AgroOcean Dashboard lets you explore, visualize, and analyze oceanographic data easily. Discover insights, trends, and patterns in real-time across different seas.
        </p>
        <Button variant="ocean" size="lg">
          <Link to="/dashboard" className="flex items-center gap-2">
            <Play className="w-5 h-5" /> Get Started
          </Link>
        </Button>
      </div>
    </div>
  </section>
);

const Services = () => {
  const services = [
    { icon: Layers, title: "Data Visualization", desc: "Interactive graphs and charts for ocean data." },
    { icon: Zap, title: "Real-Time Updates", desc: "Access live data from ARGO floats." },
    { icon: Globe, title: "Global Coverage", desc: "Explore seas and oceans worldwide." },
  ];

  return (
    <section id="services" className={cn("py-20 text-center", COLORS.paleBlue)}>
      <h2 className={cn("text-3xl font-bold mb-12", COLORS.accent)}>Our Services</h2>
      <div className="flex flex-wrap justify-center gap-6">
        {services.map((service, i) => (
          <Card
            key={i}
            className="w-64 hover:shadow-xl transition-all duration-300 border-[#00CED1]"
          >
            <CardContent>
              <service.icon className="w-8 h-8 text-[#00CED1] mb-3 mx-auto" />
              <CardTitle>{service.title}</CardTitle>
              <CardDescription>{service.desc}</CardDescription>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
};

const Oceans = () => {
  const oceans = [
    {
      name: "Atlantic Ocean",
      desc: "Explore data, currents, and temperature trends of the Atlantic Ocean.",
      img: "/images/atlanticocean.jpg",
    },
    {
      name: "Pacific Ocean",
      desc: "Visualize real-time measurements and patterns in the Pacific Ocean.",
      img: "/images/pacificocean.jpg",
    },
    {
      name: "Indian Ocean",
      desc: "Analyze salinity, pressure, and temperature profiles in the Indian Ocean.",
      img: "/images/indianocean.jpg",
    },
  ];

  return (
    <section id="oceans" className={cn("py-20 text-center", COLORS.bgGradient)}>
      <h2 className={cn("text-3xl font-bold mb-12", COLORS.accent)}>Oceans Overview</h2>
      <div className="flex flex-wrap justify-center gap-8 px-4">
        {oceans.map((ocean, i) => (
          <Card
            key={i}
            className="w-96 hover:shadow-xl transition-all duration-300 border-[#0B3D91] bg-white/50"
          >
            <CardContent>
              <img
                src={ocean.img}
                alt={ocean.name}
                className="w-full h-48 object-cover rounded-xl mb-4 border-2 border-[#00CED1]/30"
              />
              <CardTitle>{ocean.name}</CardTitle>
              <CardDescription>{ocean.desc}</CardDescription>
              <Button variant="ocean" size="sm" className="mt-4">
                Take Your Idea
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
};

const Gallery = () => (
  <section id="gallery" className={cn("py-20 text-center", COLORS.paleBlue)}>
    <h2 className={cn("text-3xl font-bold mb-12", COLORS.accent)}>Gallery</h2>
    <div className="flex flex-wrap justify-center gap-8">
      <img
        src="/images/gallery1.jpg"
        alt="Gallery 1"
        className="w-96 h-64 md:w-[500px] md:h-[350px] object-cover rounded-xl shadow-lg border-4 border-[#D6CDAF]/20"
      />
      <img
        src="/images/gallery2.jpg"
        alt="Gallery 2"
        className="w-96 h-64 md:w-[500px] md:h-[350px] object-cover rounded-xl shadow-lg border-4 border-[#D6CDAF]/20"
      />
      <img
        src="/images/gallery3.jpg"
        alt="Gallery 3"
        className="w-96 h-64 md:w-[500px] md object-cover rounded-xl shadow-lg border-4 border-[#D6CDAF]/20"
      />
    </div>
  </section>
);

const Reviews = () => {
  const reviews = [
    { name: "Alice", text: "Amazing platform! The visualizations are really helpful." },
    { name: "Bob", text: "Intuitive interface and real-time data. Love it!" },
    { name: "Charlie", text: "Perfect tool for researchers and students." },
  ];

  return (
    <section id="reviews" className="py-20 bg-[#0B3D91] text-center">
      <h2 className={cn("text-3xl font-bold mb-12", COLORS.accent)}>Reviews</h2>
      <div className="flex flex-wrap justify-center gap-6">
        {reviews.map((review, i) => (
          <Card
            key={i}
            className="w-80 hover:shadow-xl transition-all duration-300 bg-[#E0F7FA]/90 border-[#00CED1]"
          >
            <CardContent>
              <div className="flex items-center gap-2 mb-3 justify-center">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 text-[#FFD700]" />
                ))}
              </div>
              <CardDescription>"{review.text}"</CardDescription>
              <p className={cn("mt-3 font-semibold", COLORS.accent)}>{review.name}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
};

const Footer = () => (
  <footer className="bg-gradient-to-r from-[#0B3D91] via-[#009688] to-[#E0F7FA] text-[#0B3D91] py-12 text-center">
    <p>&copy; 2025 AgroOcean. All rights reserved.</p>
  </footer>
);

const Homepage = () => (
  <div className={cn("min-h-screen", COLORS.bgGradient)}>
    <Header />
    <Hero />
    <Services />
    <Oceans />
    <Gallery />
    <Reviews />
    <Footer />
  </div>
);

export default Homepage;
