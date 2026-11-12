import React from 'react';
import {
  UtensilsCrossed,
  ShoppingCart,
  Car,
  Home,
  Zap,
  ShoppingBag,
  HeartPulse,
  Film,
  GraduationCap,
  MoreHorizontal,
  Briefcase,
  Laptop,
  Building2,
  TrendingUp,
  Gift,
  Coins,
  Banknote,
  CreditCard,
  Smartphone,
  Landmark,
  Layers,
  CircleDollarSign,
  HelpCircle,
  Tag,
  Folder,
  Star,
  Coffee,
  Fuel,
  Plane,
  Music,
  Tv,
  Gamepad2,
  Dumbbell,
  BookOpen,
  Dog,
  Baby,
  Shirt,
  Scissors,
  Wrench,
  ShieldCheck,
  Receipt,
  PiggyBank,
  Heart,
  Stethoscope,
  Smile,
  Sparkles,
  LucideProps,
} from 'lucide-react';

export interface CategoryColorPreset {
  id: string;
  name: string;
  color: string;
  bgLight: string;
}

export const CATEGORY_COLOR_PRESETS: CategoryColorPreset[] = [
  { id: 'orange', name: 'Orange', color: '#ea580c', bgLight: 'bg-orange-50 text-orange-600 border-orange-200' },
  { id: 'emerald', name: 'Emerald', color: '#059669', bgLight: 'bg-emerald-50 text-emerald-600 border-emerald-200' },
  { id: 'green', name: 'Green', color: '#16a34a', bgLight: 'bg-green-50 text-green-600 border-green-200' },
  { id: 'sky', name: 'Sky', color: '#0284c7', bgLight: 'bg-sky-50 text-sky-600 border-sky-200' },
  { id: 'blue', name: 'Blue', color: '#2563eb', bgLight: 'bg-blue-50 text-blue-600 border-blue-200' },
  { id: 'purple', name: 'Purple', color: '#9333ea', bgLight: 'bg-purple-50 text-purple-600 border-purple-200' },
  { id: 'violet', name: 'Violet', color: '#7c3aed', bgLight: 'bg-violet-50 text-violet-600 border-violet-200' },
  { id: 'pink', name: 'Pink', color: '#db2777', bgLight: 'bg-pink-50 text-pink-600 border-pink-200' },
  { id: 'rose', name: 'Rose', color: '#e11d48', bgLight: 'bg-rose-50 text-rose-600 border-rose-200' },
  { id: 'amber', name: 'Amber', color: '#d97706', bgLight: 'bg-amber-50 text-amber-600 border-amber-200' },
  { id: 'teal', name: 'Teal', color: '#0d9488', bgLight: 'bg-teal-50 text-teal-600 border-teal-200' },
  { id: 'cyan', name: 'Cyan', color: '#0891b2', bgLight: 'bg-cyan-50 text-cyan-600 border-cyan-200' },
  { id: 'slate', name: 'Slate', color: '#64748b', bgLight: 'bg-slate-100 text-slate-700 border-slate-200' },
];

export const AVAILABLE_CATEGORY_ICONS: { name: string; label: string }[] = [
  { name: 'UtensilsCrossed', label: 'Food & Dining' },
  { name: 'Coffee', label: 'Coffee / Drinks' },
  { name: 'ShoppingCart', label: 'Groceries' },
  { name: 'ShoppingBag', label: 'Shopping' },
  { name: 'Car', label: 'Transport / Car' },
  { name: 'Fuel', label: 'Fuel / Gas' },
  { name: 'Plane', label: 'Travel / Flight' },
  { name: 'Home', label: 'Home / Rent' },
  { name: 'Zap', label: 'Bills / Electricity' },
  { name: 'HeartPulse', label: 'Health' },
  { name: 'Stethoscope', label: 'Medical' },
  { name: 'Dumbbell', label: 'Fitness / Gym' },
  { name: 'Film', label: 'Movies / Film' },
  { name: 'Music', label: 'Music' },
  { name: 'Tv', label: 'TV / Streaming' },
  { name: 'Gamepad2', label: 'Gaming' },
  { name: 'GraduationCap', label: 'Education' },
  { name: 'BookOpen', label: 'Books' },
  { name: 'Briefcase', label: 'Work / Job' },
  { name: 'Laptop', label: 'Tech / Freelance' },
  { name: 'Building2', label: 'Business' },
  { name: 'TrendingUp', label: 'Investments' },
  { name: 'PiggyBank', label: 'Savings' },
  { name: 'Coins', label: 'Coins' },
  { name: 'Banknote', label: 'Cash' },
  { name: 'CreditCard', label: 'Card' },
  { name: 'Landmark', label: 'Bank / Govt' },
  { name: 'Gift', label: 'Gift' },
  { name: 'Dog', label: 'Pet Care' },
  { name: 'Baby', label: 'Baby / Kids' },
  { name: 'Shirt', label: 'Clothing' },
  { name: 'Scissors', label: 'Salon / Care' },
  { name: 'Wrench', label: 'Repairs' },
  { name: 'Smartphone', label: 'Mobile / Phone' },
  { name: 'ShieldCheck', label: 'Insurance' },
  { name: 'Receipt', label: 'Receipt' },
  { name: 'Heart', label: 'Charity / Love' },
  { name: 'Star', label: 'Star' },
  { name: 'Smile', label: 'Personal' },
  { name: 'Sparkles', label: 'Special' },
  { name: 'Tag', label: 'Tag' },
  { name: 'Folder', label: 'Folder' },
  { name: 'Layers', label: 'Layers' },
  { name: 'CircleDollarSign', label: 'Dollar' },
  { name: 'MoreHorizontal', label: 'Other' },
];

interface CategoryIconProps extends LucideProps {
  name: string;
}

export const CategoryIcon: React.FC<CategoryIconProps> = ({ name, ...props }) => {
  switch (name) {
    case 'Tag':
      return <Tag {...props} />;
    case 'Folder':
      return <Folder {...props} />;
    case 'Star':
      return <Star {...props} />;
    case 'UtensilsCrossed':
      return <UtensilsCrossed {...props} />;
    case 'ShoppingCart':
      return <ShoppingCart {...props} />;
    case 'Car':
      return <Car {...props} />;
    case 'Home':
      return <Home {...props} />;
    case 'Zap':
      return <Zap {...props} />;
    case 'ShoppingBag':
      return <ShoppingBag {...props} />;
    case 'HeartPulse':
      return <HeartPulse {...props} />;
    case 'Film':
      return <Film {...props} />;
    case 'GraduationCap':
      return <GraduationCap {...props} />;
    case 'MoreHorizontal':
      return <MoreHorizontal {...props} />;
    case 'Briefcase':
      return <Briefcase {...props} />;
    case 'Laptop':
      return <Laptop {...props} />;
    case 'Building2':
      return <Building2 {...props} />;
    case 'TrendingUp':
      return <TrendingUp {...props} />;
    case 'Gift':
      return <Gift {...props} />;
    case 'Coins':
      return <Coins {...props} />;
    case 'Banknote':
      return <Banknote {...props} />;
    case 'CreditCard':
      return <CreditCard {...props} />;
    case 'Smartphone':
      return <Smartphone {...props} />;
    case 'Landmark':
      return <Landmark {...props} />;
    case 'Layers':
      return <Layers {...props} />;
    case 'CircleDollarSign':
      return <CircleDollarSign {...props} />;
    case 'Coffee':
      return <Coffee {...props} />;
    case 'Fuel':
      return <Fuel {...props} />;
    case 'Plane':
      return <Plane {...props} />;
    case 'Music':
      return <Music {...props} />;
    case 'Tv':
      return <Tv {...props} />;
    case 'Gamepad2':
      return <Gamepad2 {...props} />;
    case 'Dumbbell':
      return <Dumbbell {...props} />;
    case 'BookOpen':
      return <BookOpen {...props} />;
    case 'Dog':
      return <Dog {...props} />;
    case 'Baby':
      return <Baby {...props} />;
    case 'Shirt':
      return <Shirt {...props} />;
    case 'Scissors':
      return <Scissors {...props} />;
    case 'Wrench':
      return <Wrench {...props} />;
    case 'ShieldCheck':
      return <ShieldCheck {...props} />;
    case 'Receipt':
      return <Receipt {...props} />;
    case 'PiggyBank':
      return <PiggyBank {...props} />;
    case 'Heart':
      return <Heart {...props} />;
    case 'Stethoscope':
      return <Stethoscope {...props} />;
    case 'Smile':
      return <Smile {...props} />;
    case 'Sparkles':
      return <Sparkles {...props} />;
    default:
      return <HelpCircle {...props} />;
  }
};

