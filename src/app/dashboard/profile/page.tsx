import { createClient } from "../../../../supabase/server";
import { redirect } from "next/navigation";
import DashboardNavbar from "@/components/dashboard-navbar";
import ProfileForm from "@/components/profile-form";
import PasswordChangeForm from "@/components/password-change-form";
import ProfilePictureUpload from "@/components/profile-picture-upload";
import PersonaForm from "@/components/persona-form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { UserCircle, Lock, Image, BookUser } from "lucide-react";

export default async function ProfilePage({
  searchParams,
}: {
  searchParams: { tab?: string };
}) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return redirect("/sign-in");
  }

  // Get user profile data
  const { data: profile } = await supabase
    .from("users")
    .select("*")
    .eq("id", user.id)
    .single();

  return (
    <>
      <DashboardNavbar />
      <main className="w-full">
        <div className="container mx-auto px-4 py-8 flex flex-col gap-8">
          <header className="flex flex-col gap-4">
            <h1 className="text-3xl font-bold">Profile Settings</h1>
            <p className="text-muted-foreground">
              Manage your account settings and profile information
            </p>
          </header>

          <Tabs defaultValue={searchParams.tab || "profile"} className="w-full">
            <TabsList className="grid w-full md:w-auto grid-cols-4 md:inline-flex">
              <TabsTrigger value="profile" className="flex items-center gap-2">
                <UserCircle className="h-4 w-4" />
                <span className="hidden md:inline">Profile</span>
              </TabsTrigger>
              <TabsTrigger value="persona" className="flex items-center gap-2">
                <BookUser className="h-4 w-4" />
                <span className="hidden md:inline">Persona</span>
              </TabsTrigger>
              <TabsTrigger value="password" className="flex items-center gap-2">
                <Lock className="h-4 w-4" />
                <span className="hidden md:inline">Password</span>
              </TabsTrigger>
              <TabsTrigger value="picture" className="flex items-center gap-2">
                <Image className="h-4 w-4" />
                <span className="hidden md:inline">Profile Picture</span>
              </TabsTrigger>
            </TabsList>

            <div className="mt-6">
              <TabsContent value="profile">
                <Card>
                  <CardHeader>
                    <CardTitle>Profile Information</CardTitle>
                    <CardDescription>
                      Update your personal information
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ProfileForm user={user} profile={profile} />
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="password">
                <Card>
                  <CardHeader>
                    <CardTitle>Change Password</CardTitle>
                    <CardDescription>
                      Update your password to keep your account secure
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <PasswordChangeForm />
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="persona">
                <Card>
                  <CardHeader>
                    <CardTitle>Persona</CardTitle>
                    <CardDescription>
                      Tell others about yourself, your passions, and your work
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <PersonaForm user={user} profile={profile} />
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="picture">
                <Card>
                  <CardHeader>
                    <CardTitle>Profile Picture</CardTitle>
                    <CardDescription>
                      Upload or update your profile picture
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ProfilePictureUpload user={user} profile={profile} />
                  </CardContent>
                </Card>
              </TabsContent>
            </div>
          </Tabs>
        </div>
      </main>
    </>
  );
}
