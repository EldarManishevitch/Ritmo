import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Music, Mail, Facebook } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import GoogleIcon from '@/components/GoogleIcon';

export default function Landing() {
  const handleGoogle = () => {
    base44.auth.loginWithProvider('google', '/language-select');
  };

  const handleFacebook = () => {
    base44.auth.loginWithProvider('facebook', '/language-select');
  };

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-6"
      style={{ backgroundColor: '#FBF9F6' }}
    >
      <div className="w-full max-w-sm text-center">
        {/* Brand */}
        <div className="flex items-center justify-center gap-3 mb-10">
          <div
            className="h-12 w-12 rounded-xl flex items-center justify-center"
            style={{ backgroundColor: '#D96B43' }}
          >
            <Music className="h-6 w-6 text-white" />
          </div>
          <div className="text-left">
            <h1 className="text-2xl font-bold" style={{ color: '#2C2A29' }}>
              Ritmo
            </h1>
            <p className="text-xs" style={{ color: '#B8B4AE' }}>
              Learn languages through music
            </p>
          </div>
        </div>

        <h2 className="text-3xl font-bold mb-2" style={{ color: '#2C2A29' }}>
          Sing the chorus.
        </h2>
        <h2 className="text-3xl font-bold mb-8" style={{ color: '#2C2A29' }}>
          Speak the language.
        </h2>

        {/* Google */}
        <Button
          variant="outline"
          className="w-full h-13 text-base font-medium mb-3"
          onClick={handleGoogle}
        >
          <GoogleIcon className="w-5 h-5 mr-3" />
          Continue with Google
        </Button>

        {/* Facebook */}
        <Button
          variant="outline"
          className="w-full h-13 text-base font-medium mb-6"
          onClick={handleFacebook}
        >
          <Facebook className="w-5 h-5 mr-3 text-[#1877F2]" />
          Continue with Facebook
        </Button>

        {/* Email alternative */}
        <Link
          to="/login"
          className="flex items-center justify-center gap-2 text-sm font-medium"
          style={{ color: '#D96B43' }}
        >
          <Mail className="h-4 w-4" />
          Sign in with email
        </Link>

        <p className="text-xs mt-8" style={{ color: '#B8B4AE' }}>
          No credit card &bull; Free forever for learners
        </p>
      </div>
    </div>
  );
}