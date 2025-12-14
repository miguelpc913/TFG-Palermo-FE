import Spinner from "@/components/Spinner/Spinner";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { FieldGroup, Field, FieldLabel, FieldDescription } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import validateEmail from "@/utils/validateEmail";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";

type LoginResponseType = {
  rootDocUrl: string;
  token: string;
};

function Register() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isValid, setIsValid] = useState(false);
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setIsValid(validateEmail(email) && password.length > 3 && confirmPassword === password);
  }, [email, password, confirmPassword]);

  const signUpHandler = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/auth/register`, {
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
        <Card className="m-auto w-120">
          <CardHeader>
            <CardTitle>Create a new account</CardTitle>
            <CardDescription>Enter your email below for your new account</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={signUpHandler}>
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
                  <div className="flex items-center">
                    <FieldLabel htmlFor="confirmPassword">Confirm password</FieldLabel>
                  </div>
                  <Input
                    id="confirmPassword"
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={e => {
                      const value = e.target.value;
                      setConfirmPassword(value);
                    }}
                  />
                </Field>
                <Field>
                  <Button type="submit" disabled={!isValid || isLoading}>
                    {isLoading ? <Spinner height={"20px"} width={"20px"}></Spinner> : <>Sign up</>}
                  </Button>
                  <FieldDescription className="text-center">
                    Already have an account? <Link to="/">Log in</Link>
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

export const Route = createFileRoute("/register")({
  component: Register,
});
