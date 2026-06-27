import React from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { LogIn, Facebook } from "lucide-react";
import AuthLayout from "@/components/AuthLayout";
import GoogleIcon from "@/components/GoogleIcon";

export default function Login() {
  const handleGoogle = () => {
    base44.auth.loginWithProvider("google", "/language-select");
  };

  const handleFacebook = () => {
    base44.auth.loginWithProvider("facebook", "/language-select");
  };

  return (
    <AuthLayout
      icon={LogIn}
      title="Welcome back"
      subtitle="Log in to your account"
      footer={
        <>
          Don't have an account?{" "}
          <Link to="/register" className="text-primary font-medium hover:underline">
            Create one
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