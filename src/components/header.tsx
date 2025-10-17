"use client";
import React from "react";
import { InputGroup, InputGroupAddon, InputGroupInput } from "./ui/input-group";
import { SearchIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { encrypt } from "@/lib/crypto";

const Header = () => {
  const [query, setQuery] = React.useState("");
  const router = useRouter();

  const saveSearchToLocal = (term: string) => {
    if (!term.trim()) return;

    // 1️⃣ Get existing searches
    const prev = JSON.parse(localStorage.getItem("searchHistory") || "[]");

    // 2️⃣ Remove duplicates and limit to last 10
    const updated = [term, ...prev.filter((x: string) => x !== term)].slice(
      0,
      10
    );

    // 3️⃣ Save back
    localStorage.setItem("searchHistory", JSON.stringify(updated));
  };

  const handleSearch = () => {
    const trimmed = query.trim();
    if (!trimmed) return;
    saveSearchToLocal(trimmed);

    const encryptedQuery = encrypt(trimmed);
    router.push(`/results?q=${encryptedQuery}`);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") handleSearch();
  };

  return (
    <div className="w-full h-18 bg-[#0c0c0c] flex items-center px-4 text-white justify-between">
      <Link className="flex items-center gap-2 w-[30%]" href="/">
        <div className="h-10 w-10 bg-red-500" />
        <p className="text-lg font-bold tracking-wide">App Name</p>
      </Link>

      <div className="w-[40%]">
        <InputGroup className="text-white bg-[#3b3b3b] border-[#3b3b3b]/50">
          <InputGroupInput
            placeholder="Search..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          <InputGroupAddon
            onClick={handleSearch}
            className="cursor-pointer px-3 transition"
          >
            <SearchIcon />
          </InputGroupAddon>
        </InputGroup>
      </div>

      <div className="w-[30%]" />
    </div>
  );
};

export default Header;
