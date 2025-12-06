"use client";

import { FormEvent } from "react";

type LoginFormProps = {
    title: string;
    fieldPrefix: 'DD' | 'S_JIC' | 'F_JIC';
    loginUpdate: (loginPayload: LoginPayload) => Promise<void>;
};

export type LoginPayload = {
    [k: string]: string;
    service: 'DD' | 'S_JIC' | 'F_JIC';
};

const fieldStyleClasses = [
  "w-full",
  "p-2",
  "rounded-md",
  "border",
  "focus:outline-none",
  "focus:ring-2",
  "focus:ring-blue-500",
  "bg-white",
  "text-gray-900",
  "placeholder-gray-500",
  "border-gray-300",
  "dark:bg-gray-800",
  "dark:text-white",
  "dark:placeholder-gray-400",
  "dark:border-gray-600",
].join(' ');

const buttonStyleClasses = [
  "w-full",
  "p-2",
  "rounded-md",
  "bg-blue-600",
  "text-white",
  "hover:bg-blue-700",
  "font-semibold",
  "transition",
  "duration-150",
].join(' ');

const formStyleClasses = [
  "max-w-sm",
  "mx-auto",
  "my-4",
  "p-2",
  "rounded-lg",
  "shadow-lg",
  "bg-white",
  "dark:bg-gray-700",
].join(' ');

const headerStyleClasses = [
  "text-xl",
  "font-semibold",
  "text-gray-800",
  "dark:text-white",
].join(' ');

export default function LoginForm({ title, fieldPrefix, loginUpdate }: LoginFormProps) {
  const doLogin = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const loginPayload = Object.fromEntries(new FormData(e.target as HTMLFormElement).entries()) as LoginPayload;
    loginUpdate({ ...loginPayload, service: fieldPrefix });
  }

  return (
    <div className={formStyleClasses}>
      <form onSubmit={doLogin} className="space-y-4">
        <h3 className={headerStyleClasses}>{title} Login</h3>
        <div>
          <input
            placeholder={`${title} Username`}
            name={`${fieldPrefix}_username`}
            className={fieldStyleClasses}
            required
          />
        </div>
        <div>
          <input 
            type="password" 
            placeholder={`${title} Password`}
            name={`${fieldPrefix}_password`}
            className={fieldStyleClasses}
            required
          />
        </div>
        <button
          type="submit"
          className={buttonStyleClasses}
        >
          {title} Login
        </button>
      </form>
    </div>
  );
}
