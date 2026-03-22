import logoImage from '../assets/LOGO.png';

interface LogoProps {
    className?: string;
}

export default function Logo({ className = "h-20 w-auto" }: LogoProps) {
    return (
        <img
            src={logoImage}
            alt="University of Kelaniya - Department of Industrial Management"
            className={className}
        />
    );
}
