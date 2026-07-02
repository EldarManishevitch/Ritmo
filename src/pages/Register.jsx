import React from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { UserPlus, Facebook } from "lucide-react";
import AuthLayout from "@/components/AuthLayout";
import GoogleIcon from "@/components/GoogleIcon";
import SEOHead from "@/components/SEOHead";

export default function Register() {
  const handleGoogle = () => {
    base44.auth.loginWithProvider("google", "/dashboard");
  };

  const handleFacebook = () => {
    base44.auth.loginWithProvider("facebook", "/dashboard");
  };

  return (
    <AuthLayout
      icon={UserPlus}
      seo={
        <SEOHead
          title="Sign in or create your account | Spanish Beats"
          description="Join Spanish Beats and start learning Spanish through real music — Bad Bunny, Aventura, Karol G, and more. Free to start, no credit card needed."
        />
      }
      title="Create your account"
      subtitle="Sign up to get started"
      footer={
        <>
          Already have an account?{" "}
          <Link to="/login" className="text-primary font-medium hover:underline">
            Log in
          </Link>
        </>
      }
    >
      <Button
        variant="outline"
        className="w-full h-12 text-sm font-medium"
        onClick={handleGoogle}
      >
        <GoogleIcon className="w-5 h-5 mr-2" />
        Continue with Google
      </Button>
      <Button
        variant="outline"
        className="w-full h-12 text-sm font-medium mt-3"
        onClick={handleFacebook}
      >
        <Facebook className="w-5 h-5 mr-2 text-[#1877F2]" />
        Continue with Facebook
      </Button>
    </AuthLayout>
  );
}