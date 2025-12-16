import Spinner from "@/components/Spinner/Spinner";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { FieldGroup, Field, FieldLabel, FieldDescription } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import getJwtPayload from "@/utils/getJwtPayload";
import validateEmail from "@/utils/validateEmail";
import { createFileRoute, Link, redirect, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";

type LoginResponseType = {
  rootDocUrl: string;
  token: string;
};

function Login() {
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [isValid, setIsValid] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    setIsValid(validateEmail(email) && password.length > 3);
  }, [email, password]);

  const loginPostHandler = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json;charset=UTF-8",
        },
        body: JSON.stringify({
          email,
          password,
        }),
      });
      if (!response.ok) {
        throw new Error(`Error code ${response.status}`);
      }
      const data: LoginResponseType = await response.json();
      localStorage.setItem(import.meta.env.VITE_LOCAL_STORAGE_TOKEN_KEY, data.token);
      setIsLoading(false);
      navigate({
        to: "/documents",
      });
    } catch (e) {
      const error = e as Error;
      toast.error(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col justify-between">
      <div className={"flex flex-col gap-6 h-screen"}>
        <Card className="m-auto sm:w-120 w-[90%]">
          <CardHeader>
            <CardTitle>Login to your account</CardTitle>
            <CardDescription>Enter your email below to login to your account</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={loginPostHandler}>
              <FieldGroup>
                <Field>
                  <FieldLabel htmlFor="email">Email</FieldLabel>
                  <Input
                    id="email"
                    type="email"
                    placeholder="m@example.com"
                    required
                    value={email}
                    onChange={e => {
                      const value = e.target.value;
                      setEmail(value);
                    }}
                  />
                </Field>
                <Field>
                  <div className="flex items-center">
                    <FieldLabel htmlFor="password">Password</FieldLabel>
                  </div>
                  <Input
                    id="password"
                    type="password"
                    required
                    value={password}
                    onChange={e => {
                      const value = e.target.value;
                      setPassword(value);
                    }}
                  />
                </Field>
                <Field>
                  <Button type="submit" disabled={!isValid || isLoading}>
                    {isLoading ? <Spinner height={"20px"} width={"20px"}></Spinner> : <>Login</>}
                  </Button>
                  <FieldDescription className="text-center">
                    Don&apos;t have an account? <Link to="/register">Sign up</Link>
                  </FieldDescription>
                </Field>
              </FieldGroup>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export const Route = createFileRoute("/login")({
  component: Login,
  beforeLoad: async () => {
    const { exp } = getJwtPayload();
    if (exp) {
      const isExpired = Date.now() >= exp * 1000; // exp is in seconds
      if (!isExpired) {
        throw redirect({
          to: "/documents",
        });
      }
    }
  },
});
