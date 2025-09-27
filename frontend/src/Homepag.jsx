import React from "react";
import { Link } from "react-router-dom";
import { Database, Layers, Zap, Globe, Play, Star } from "lucide-react";

const cn = (...classes) => classes.filter(Boolean).join(" ");

const Button = ({ className, variant = "default", size = "default", children, ...props }) => {
  const variantClasses = {
    default: "bg-blue-500 text-white hover:bg-blue-600",
    surface: "bg-white text-gray-800 hover:bg-gray-100",
    ocean: "bg-gradient-to-r from-blue-500 to-cyan-400 text-white hover:shadow-lg",
  };
  const sizeClasses = {
    default: "h-10 px-4 py-2",
    sm: "h-9 px-3",
    lg: "h-11 px-8",
  };
  return (
    <button
      className={cn(
        "rounded-md font-medium transition-colors inline-flex items-center justify-center gap-2",
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
      "rounded-lg border border-blue-300 bg-white/20 shadow-md backdrop-blur-sm",
      className
    )}
    {...props}
  >
    {children}
  </div>
);

const CardContent = ({ className, children, ...props }) => (
  <div className={cn("p-6", className)} {...props}>{children}</div>
);
const CardTitle = ({ className, children, ...props }) => (
  <h3 className={cn("text-lg font-semibold mb-2 text-white", className)} {...props}>{children}</h3>
);
const CardDescription = ({ className, children, ...props }) => (
  <p className={cn("text-sm text-white/90", className)} {...props}>{children}</p>
);

const Header = () => (
  <header className="fixed top-0 w-full z-50 bg-gradient-to-r from-blue-600 via-blue-700 to-cyan-500/90 backdrop-blur-md border-b border-blue-300 shadow-md text-white">
    <div className="container mx-auto px-4 py-4 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 bg-white/30 rounded-lg flex items-center justify-center">
          <Database className="w-5 h-5 text-white" />
        </div>
        <h1 className="text-xl font-bold text-white">AgroOcean</h1>
      </div>
      <nav className="hidden md:flex items-center gap-6">
        <a href="#services" className="hover:text-yellow-300 transition">Services</a>
        <a href="#oceans" className="hover:text-yellow-300 transition">Oceans</a>
        <a href="#gallery" className="hover:text-yellow-300 transition">Gallery</a>
        <a href="#reviews" className="hover:text-yellow-300 transition">Reviews</a>

        {/* Compare button */}
        <Link to="/compare">
          <button className="bg-yellow-500 text-black px-4 py-2 rounded-lg hover:bg-yellow-600 transition">
            Compare
          </button>
        </Link>

        {/* Existing 3D Profile button */}
        <Link to="/3d-profile">
          <button className="bg-yellow-500 text-black px-4 py-2 rounded-lg hover:bg-yellow-600 transition">
            3D Profile
          </button>
        </Link>
      </nav>
    </div>
  </header>
);


     

const Hero = () => (
  <section className="relative min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-800 via-blue-900 to-cyan-700 mt-16 text-white">
    <div className="container mx-auto px-4 flex flex-col md:flex-row items-center gap-8">
      <div className="w-full md:w-1/2">
        <img src="/images/hero.jpg" alt="Project" className="rounded-lg shadow-lg w-full border-4 border-white/30" />
      </div>
      <div className="w-full md:w-1/2 space-y-6 text-center md:text-left">
        <h1 className="text-4xl md:text-5xl font-bold text-yellow-300">Explore Our Ocean Data Dashboard</h1>
        <p className="text-lg text-white/90">
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
    <section id="services" className="py-20 bg-blue-800 text-center">
      <h2 className="text-3xl font-bold mb-12 text-yellow-300">Our Services</h2>
      <div className="flex flex-wrap justify-center gap-6">
        {services.map((service, i) => (
          <Card key={i} className="w-64 hover:shadow-xl transition-all duration-300 bg-blue-700/70 border-blue-600">
            <CardContent>
              <service.icon className="w-8 h-8 text-yellow-300 mb-3 mx-auto" />
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
    <section id="oceans" className="py-20 bg-blue-900 text-center">
      <h2 className="text-3xl font-bold mb-12 text-yellow-300">Oceans Overview</h2>
      <div className="flex flex-wrap justify-center gap-8 px-4">
        {oceans.map((ocean, i) => (
          <Card
            key={i}
            className="w-96 hover:shadow-xl transition-all duration-300 bg-blue-700/70 border-blue-600"
          >
            <CardContent>
              <img
                src={ocean.img}
                alt={ocean.name}
                className="w-full h-48 object-cover rounded-lg mb-4 border-2 border-white/20"
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
  <section id="gallery" className="py-20 bg-blue-800 text-center">
    <h2 className="text-3xl font-bold mb-12 text-yellow-300">Gallery</h2>
    <div className="flex flex-wrap justify-center gap-8">
      <img
        src="/images/gallery1.jpg"
        alt="Gallery 1"
        className="w-96 h-64 md:w-[500px] md:h-[350px] object-cover rounded-lg shadow-lg border-4 border-white/20"
      />
      <img
        src="/images/gallery2.jpg"
        alt="Gallery 2"
        className="w-96 h-64 md:w-[500px] md:h-[350px] object-cover rounded-lg shadow-lg border-4 border-white/20"
      />
      <img
        src="/images/gallery3.jpg"
        alt="Gallery 3"
        className="w-96 h-64 md:w-[500px] md:h-[350px] object-cover rounded-lg shadow-lg border-4 border-white/20"
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
    <section id="reviews" className="py-20 bg-blue-700 text-center">
      <h2 className="text-3xl font-bold mb-12 text-yellow-300">Reviews</h2>
      <div className="flex flex-wrap justify-center gap-6">
        {reviews.map((review, i) => (
          <Card key={i} className="w-80 hover:shadow-xl transition-all duration-300 bg-blue-700/70 border-blue-600">
            <CardContent>
              <div className="flex items-center gap-2 mb-3 justify-center">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 text-yellow-300" />
                ))}
              </div>
              <CardDescription>"{review.text}"</CardDescription>
              <p className="mt-3 font-semibold text-yellow-300">{review.name}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
};

const Footer = () => (
  <footer className="bg-gradient-to-r from-blue-700 via-blue-900 to-cyan-600 text-white py-12 text-center">
    <p>&copy; 2025 AgroOcean. All rights reserved.</p>
  </footer>
);

const Homepage = () => (
  <div className="min-h-screen bg-gradient-to-br from-blue-700 via-blue-900 to-cyan-600">
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
