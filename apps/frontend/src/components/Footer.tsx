
const Footer: React.FC = () => {
    return (
        <footer className="footer footer-center p-10 bg-slate-900 text-slate-400 border-t border-slate-800">
            <aside>
                <p><span className="text-white font-bold">QuintaTimer</span> - Cronometraje deportivo &copy; {new Date().getFullYear()} - Todos los derechos reservados</p>
            </aside>
        </footer>
    );
};

export default Footer;
