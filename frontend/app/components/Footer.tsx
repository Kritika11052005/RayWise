import { Github, Mail, Linkedin } from 'lucide-react';

const Footer = () => {
    return (
        <footer className="bg-background border-t border-border py-8 mt-auto">
            <div className="container mx-auto px-4">
                <div className="text-center mb-6">
                    <p className="text-lg font-medium text-foreground mb-4">
                        Made with ❤️ by Kritika Benjwal & Gauri Sharma
                    </p>
                </div>

                <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
                    {/* Kritika Benjwal */}
                    <div className="text-center">
                        <h3 className="text-xl font-semibold text-foreground mb-4">Kritika Benjwal</h3>
                        <div className="flex justify-center space-x-4">
                            <a
                                href="https://github.com/Kritika11052005"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center space-x-2 px-4 py-2 rounded-lg bg-secondary hover:bg-secondary/80 transition-colors duration-200"
                            >
                                <Github className="w-4 h-4" />
                                <span className="text-sm">GitHub</span>
                            </a>
                            <a
                                href="https://mail.google.com/mail/?view=cm&fs=1&to=ananya.benjwal@gmail.com"
                                className="flex items-center space-x-2 px-4 py-2 rounded-lg bg-secondary hover:bg-secondary/80 transition-colors duration-200"
                            >
                                <Mail className="w-4 h-4" />
                                <span className="text-sm">Email</span>
                            </a>
                            <a
                                href="https://www.linkedin.com/in/kritika-benjwal/"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center space-x-2 px-4 py-2 rounded-lg bg-secondary hover:bg-secondary/80 transition-colors duration-200"
                            >
                                <Linkedin className="w-4 h-4" />
                                <span className="text-sm">LinkedIn</span>
                            </a>
                        </div>
                    </div>

                    {/* Gauri Sharma */}
                    <div className="text-center">
                        <h3 className="text-xl font-semibold text-foreground mb-4">Gauri Sharma</h3>
                        <div className="flex justify-center space-x-4">
                            <a
                                href= "https://github.com/gauri-sharma9 "
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center space-x-2 px-4 py-2 rounded-lg bg-secondary hover:bg-secondary/80 transition-colors duration-200"
                            >
                                <Github className="w-4 h-4" />
                                <span className="text-sm">GitHub</span>
                            </a>
                            <a
                                href="https://mail.google.com/mail/?view=cm&fs=1&to=gaurisharma9104@gmail.com"
                                className="flex items-center space-x-2 px-4 py-2 rounded-lg bg-secondary hover:bg-secondary/80 transition-colors duration-200"
                            >
                                <Mail className="w-4 h-4" />
                                <span className="text-sm">Email</span>
                            </a>
                            <a
                                href=" https://www.linkedin.com/in/gauri-sharma-7a48a6332/"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center space-x-2 px-4 py-2 rounded-lg bg-secondary hover:bg-secondary/80 transition-colors duration-200"
                            >
                                <Linkedin className="w-4 h-4" />
                                <span className="text-sm">LinkedIn</span>
                            </a>
                        </div>
                    </div>
                </div>

                <div className="text-center mt-8 pt-6 border-t border-border">
                    <p className="text-sm text-muted-foreground">
                        © {new Date().getFullYear()} All rights reserved.
                    </p>
                </div>
            </div>
        </footer>
    );
};

export default Footer;