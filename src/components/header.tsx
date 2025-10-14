"use client";
import React from "react";
// import { Input } from "./ui/input";
import { InputGroup, InputGroupAddon, InputGroupInput } from "./ui/input-group";
import { SearchIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";
// import { useSearch } from "@/app/context/SearchContext";

const Header = () => {
  // const { setQuery } = useSearch();

  // const [temp, setTemp] = React.useState("");
  const [query, setQuery] = React.useState("");
  const router = useRouter();

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      router.push(`/results?q=${query.trim()}`);
    }
  };

  const handleSearchClick = () => {
    router.push(`/results?q=${query.trim()}`);
  };

  return (
    <div className=" w-full h-18 bg-[#0c0c0c] flex items-center px-4 text-white justify-between">
      <Link className=" flex items-center gap-2 w-[30%]" href="/">
        <div className=" h-10 w-10 bg-red-500"></div>
        <p className=" text-lg font-bold tracking-wide">App Name</p>
      </Link>
      <div className=" w-[40%]">
        <InputGroup className=" text-white bg-[#3b3b3b] border-[#3b3b3b]/50">
          <InputGroupInput
            placeholder="Search..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          <InputGroupAddon
            onClick={handleSearchClick}
            className="cursor-pointer px-3 transition"
          >
            <SearchIcon />
          </InputGroupAddon>
        </InputGroup>
      </div>
      <div className=" w-[30%]"></div>
    </div>
  );
};

export default Header;
