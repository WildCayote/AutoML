"use client"

import type React from "react"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { CuboidIcon as Cube } from "lucide-react"
import { login, signup } from "@/libb/features/auth/authActions"
import { useAppDispatch, useAppSelector } from "@/libb/hooks"
import { useRouter } from "next/navigation"

export type AuthMode = "signin" | "signup"

interface AuthField {
  id: string
  label: string
  type: string
  placeholder: string
  required?: boolean
}

interface AuthFormProps {
  mode?: AuthMode
  title?: string
  subtitle?: string
  fields?: AuthField[]
  showRememberMe?: boolean
  showForgotPassword?: boolean
  submitLabel?: string
  showGoogleAuth?: boolean
  googleAuthLabel?: string
  alternateActionText?: string
  alternateActionLink?: string
  alternateActionLinkText?: string
  
  logoIcon?: React.ReactNode
}

export function AuthForm({
  mode = "signin",
  title = mode === "signin" ? "Sign in" : "Sign up",
  subtitle = mode === "signin" ? "Welcome back! Please enter your details." : "Create an account to get started.",
  fields = mode === "signin"
    ? [
        { id: "email", label: "Email", type: "email", placeholder: "you@email.com", required: true },
        { id: "password", label: "Password", type: "password", placeholder: "••••••••", required: true },
      ]
    : [
        { id: "name", label: "Name", type: "text", placeholder: "Your name", required: true },
        { id: "email", label: "Email", type: "email", placeholder: "you@email.com", required: true },
        { id: "password", label: "Password", type: "password", placeholder: "••••••••", required: true },
      ],
  showRememberMe = mode === "signin",
  showForgotPassword = mode === "signin",
  submitLabel = mode === "signin" ? "Sign in" : "Sign up",
  showGoogleAuth = false,
  googleAuthLabel = `${mode === "signin" ? "Sign in" : "Sign up"} with Google`,
  alternateActionText = mode === "signin" ? "Don't have an account?" : "Already have an account?",
  alternateActionLink = mode === "signin" ? "/signup" : "/",
  alternateActionLinkText = mode === "signin" ? "Sign up" : "Sign in",
  logoIcon = <Cube className="h-5 w-5 text-blue-600" />,
}: AuthFormProps) {
  const router = useRouter()
  const dispatch = useAppDispatch()
  const { status, error, access_token, userInfo, refresh_token } = useAppSelector((state) => state.auth)
  const [formData, setFormData] = useState<Record<string, string>>({})

  useEffect(() => {
    if (access_token && refresh_token) {
      console.log("Access token detected! Redirecting...")
        localStorage.setItem("access_token", access_token);
        localStorage.setItem("refresh_token", refresh_token);
        router.push("/dashboard")
    }
  }, [access_token, refresh_token, router])

  useEffect(() => {
    if (userInfo) {
      localStorage.setItem("userInfo", JSON.stringify(userInfo))
    }
  }, [userInfo])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.id]: e.target.value,
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (mode === "signup") {
      const signupResult = await dispatch(signup({
        email: formData.email,
        username: formData.name,
        password: formData.password
      }))
      
      if (signup.fulfilled.match(signupResult)) {
        // Login after successful signup
        await dispatch(login({ 
          email: formData.email, 
          password: formData.password, 
          username: formData.name 
        }))
      }
    } else if (mode === "signin") {
      await dispatch(
              login({
                email: formData.email, 
                username: "",
                password: formData.password,
              })
            );
    }
  }

  return (
    <div className="flex-1 flex items-center justify-center p-6">
      <div className="w-full max-w-md bg-white rounded-lg p-8 shadow-sm border border-gray-100">
        <div className="flex justify-center mb-4">
          <div className="bg-blue-50 p-2 rounded-full">{logoIcon}</div>
        </div>

        <h2 className="text-2xl font-bold text-center text-gray-900 mb-2">{title}</h2>
        <p className="text-gray-500 text-center mb-6">{subtitle}</p>

        <form className="space-y-4" onSubmit={handleSubmit}>
          {fields.map((field) => (
            <div key={field.id} className="space-y-2">
              <label htmlFor={field.id} className="text-sm text-gray-500">
                {field.label}
              </label>
              <Input
                id={field.id}
                type={field.type}
                placeholder={field.placeholder}
                required={field.required}
                className="w-full"
                onChange={handleChange}
              />
            </div>
          ))}

          {typeof error === "string" && (
            <p className="text-red-500 text-sm">{error}</p>
          )}

          {showRememberMe && showForgotPassword && (
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Checkbox id="remember" />
                <label htmlFor="remember" className="text-sm text-gray-500">
                  Remember me
                </label>
              </div>
              <Link href="#" className="text-sm text-blue-600 hover:text-blue-800">
                Forgot?
              </Link>
            </div>
          )}

          <Button 
            type="submit" 
            className="w-full bg-blue-600 hover:bg-blue-700"
            disabled={status === "loading"}
          >
            {status === "loading" ? "Loading..." : submitLabel}
          </Button>

          {showGoogleAuth && (
            <>
              <div className="relative my-4">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">or</span>
                </div>
              </div>

              <Button type="button" variant="outline" className="w-full">
                <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                  <path
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    fill="#4285F4"
                  />
                  <path
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    fill="#34A853"
                  />
                  <path
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    fill="#FBBC05"
                  />
                  <path
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    fill="#EA4335"
                  />
                  <path d="M1 1h22v22H1z" fill="none" />
                </svg>
                {googleAuthLabel}
              </Button>
            </>
          )}
        </form>

        <p className="mt-6 text-center text-sm text-gray-500">
          {alternateActionText}{" "}
          <Link href={alternateActionLink} className="text-blue-600 hover:text-blue-800 font-medium">
            {alternateActionLinkText}
          </Link>
        </p>

        <p className="mt-8 text-center text-xs text-gray-400">© 2024 AutoML Platform. All rights reserved.</p>
      </div>
    </div>
  )
}
