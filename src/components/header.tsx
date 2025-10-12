"use client";
import React from "react";
// import { Input } from "./ui/input";
import { InputGroup, InputGroupAddon, InputGroupInput } from "./ui/input-group";
import { SearchIcon } from "lucide-react";
import { useSearch } from "@/app/context/SearchContext";

const Header = () => {
  const { setQuery } = useSearch();

  const [temp, setTemp] = React.useState("");

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      setQuery(temp.trim());
    }
  };

  const handleSearchClick = () => {
    setQuery(temp.trim());
  };

  return (
    <div className=" w-full h-18 bg-[#1b1b1b] flex items-center px-4 text-white justify-between">
      <div className=" flex items-center gap-2 w-[30%]">
        <div className=" h-10 w-10 bg-red-500"></div>
        <p className=" text-lg font-bold tracking-wide">App Name</p>
      </div>
      <div className=" w-[40%]">
        <InputGroup className=" text-black bg-white">
          <InputGroupInput
            placeholder="Search..."
            value={temp}
            onChange={(e) => setTemp(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          <InputGroupAddon
            onClick={handleSearchClick}
            className="cursor-pointer px-3 hover:bg-gray-200 transition"
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
