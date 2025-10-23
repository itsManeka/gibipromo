import { FaInstagram, FaFacebookF, FaTelegramPlane } from 'react-icons/fa'
import { FaXTwitter, FaThreads, FaBluesky } from 'react-icons/fa6'
import { SiKofi } from 'react-icons/si'
import { FiMail } from 'react-icons/fi'

/**
 * Componente de links sociais
 * 
 * Features:
 * - Exibe links sociais
 * 
 * @example
 * ```tsx
 * <SocialLinks />
 * ```
 */
export default function SocialLinks() {
    return (
        <div className="flex items-center space-x-4">
            <a
                href="mailto:contato.gibipromo@gmail.com"
                className="text-purple-800 dark:text-primary-light hover:text-purple-950 dark:hover:text-primary-yellow transition-colors transform hover:scale-110 duration-300"
                title="Email"
            >
                <FiMail className="h-5 w-5" />
            </a>
            <a
                target="_blank"
                href="https://www.instagram.com/gibipromo/"
                className="text-purple-800 dark:text-primary-light hover:text-purple-950 dark:hover:text-primary-yellow transition-colors transform hover:scale-110 duration-300"
                title="Instagram"
            >
                <FaInstagram className="h-5 w-5" />
            </a>
            <a
                target="_blank"
                href="https://www.facebook.com/gibipromo/"
                className="text-purple-800 dark:text-primary-light hover:text-purple-950 dark:hover:text-primary-yellow transition-colors transform hover:scale-110 duration-300"
                title="Facebook"
            >
                <FaFacebookF className="h-5 w-5" />
            </a>
            <a
                target="_blank"
                href="https://x.com/gibipromo"
                className="text-purple-800 dark:text-primary-light hover:text-purple-950 dark:hover:text-primary-yellow transition-colors transform hover:scale-110 duration-300"
                title="Twitter"
            >
                <FaXTwitter className="h-5 w-5" />
            </a>
            <a
                target="_blank"
                href="https://www.threads.com/@gibipromo"
                className="text-purple-800 dark:text-primary-light hover:text-purple-950 dark:hover:text-primary-yellow transition-colors transform hover:scale-110 duration-300"
                title="Threads"
            >
                <FaThreads className="h-5 w-5" />
            </a>
            <a
                target="_blank"
                href="https://bsky.app/profile/gibipromo.bsky.social"
                className="text-purple-800 dark:text-primary-light hover:text-purple-950 dark:hover:text-primary-yellow transition-colors transform hover:scale-110 duration-300"
                title="Bluesky"
            >
                <FaBluesky className="h-5 w-5" />
            </a>
            <a
                target="_blank"
                href="https://t.me/GibiPromo_bot"
                className="text-purple-800 dark:text-primary-light hover:text-purple-950 dark:hover:text-primary-yellow transition-colors transform hover:scale-110 duration-300"
                title="Telegram"
            >
                <FaTelegramPlane className="h-5 w-5" />
            </a>
            <a
                target="_blank"
                href="https://ko-fi.com/gibipromo"
                className="text-purple-800 dark:text-primary-light hover:text-purple-950 dark:hover:text-primary-yellow transition-colors transform hover:scale-110 duration-300"
                title="Ko-fi"
            >
                <SiKofi className="h-5 w-5" />
            </a>
        </div>
    );
}