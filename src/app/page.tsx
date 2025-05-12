import Footer from "@/components/footer";
import Hero from "@/components/hero";
import Navbar from "@/components/navbar";
import {
  ArrowUpRight,
  BarChart3,
  ListTodo,
  Share2,
  Clock,
  LineChart,
} from "lucide-react";
import { createClient } from "../../supabase/server";

export default async function Home() {
  const supabase = await createClient();
  await supabase.auth.getUser();

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      <Navbar />
      <Hero />

      {/* Features Section */}
      <section className="py-24 bg-white" id="features">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">Key Features</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              A minimal project tracking dashboard with everything you need and
              nothing you don&apos;t.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                icon: <BarChart3 className="w-6 h-6" />,
                title: "Progress Visualization",
                description:
                  "Simple charts and progress bars to track completion",
              },
              {
                icon: <ListTodo className="w-6 h-6" />,
                title: "Customizable Milestones",
                description: "Create and manage project milestones",
              },
              {
                icon: <Share2 className="w-6 h-6" />,
                title: "Public Sharing",
                description: "Share progress with unique project URLs",
              },
              {
                icon: <Clock className="w-6 h-6" />,
                title: "Real-time Updates",
                description: "Timestamp indicators for latest changes",
              },
            ].map((feature, index) => (
              <div
                key={index}
                className="p-6 bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="text-blue-600 mb-4">{feature.icon}</div>
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">How It Works</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Track your projects in three simple steps
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-12">
            <div className="text-center">
              <div className="bg-blue-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <span className="text-blue-600 text-xl font-bold">1</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">Create Project</h3>
              <p className="text-gray-600">
                Set up your project with custom milestones and targets
              </p>
            </div>
            <div className="text-center">
              <div className="bg-blue-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <span className="text-blue-600 text-xl font-bold">2</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">Track Progress</h3>
              <p className="text-gray-600">
                Update status and mark milestones as completed
              </p>
            </div>
            <div className="text-center">
              <div className="bg-blue-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <span className="text-blue-600 text-xl font-bold">3</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">Share Updates</h3>
              <p className="text-gray-600">
                Generate a public URL to share with stakeholders
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Demo Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="flex flex-col lg:flex-row items-center gap-12">
            <div className="lg:w-1/2">
              <h2 className="text-3xl font-bold mb-4">
                Clean, Minimal Interface
              </h2>
              <p className="text-gray-600 mb-6">
                Our dashboard provides a distraction-free environment to focus
                on what matters most - your project&apos;s progress.
              </p>
              <ul className="space-y-3">
                {[
                  "Project cards with completion percentage",
                  "Visual progress indicators",
                  "Milestone tracking",
                  "Timestamp for latest updates",
                ].map((item, index) => (
                  <li key={index} className="flex items-center gap-2">
                    <div className="bg-green-100 rounded-full p-1">
                      <svg
                        className="w-4 h-4 text-green-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M5 13l4 4L19 7"
                        ></path>
                      </svg>
                    </div>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="lg:w-1/2 bg-gray-100 rounded-lg p-4">
              <div className="aspect-video bg-white rounded-lg shadow-md flex items-center justify-center">
                <LineChart className="w-16 h-16 text-blue-500 opacity-50" />
                <span className="ml-2 text-gray-400">Dashboard Preview</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-blue-600 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">
            Ready to Track Your Progress?
          </h2>
          <p className="text-blue-100 mb-8 max-w-2xl mx-auto">
            Start monitoring your projects and sharing updates with your team
            today.
          </p>
          <a
            href="/dashboard"
            className="inline-flex items-center px-6 py-3 text-blue-600 bg-white rounded-lg hover:bg-gray-100 transition-colors font-medium"
          >
            Get Started Now
            <ArrowUpRight className="ml-2 w-4 h-4" />
          </a>
        </div>
      </section>

      <Footer />
    </div>
  );
}
