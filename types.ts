import { LucideIcon } from 'lucide-react';

export interface NavItem {
  label: string;
  href: string;
}

export interface FeatureItem {
  title: string;
  description: string;
  icon: LucideIcon;
}

export interface StepItem {
  number: string;
  title: string;
  description: string;
}

export interface BenefitItem {
  title: string;
  description: string;
  icon: LucideIcon;
}

export interface TestimonialItem {
  name: string;
  role: string;
  comment: string;
  imageUrl: string;
}
