import React from "react";
import "./footer.css";
import { useNavigate } from "react-router-dom";

const Footer = () => {
  const navigate = useNavigate();
  return (
    <footer className="footer">

      <div className="footer-container">

        {/* LEFT */}
        <div className="footer-section">
          <h2 className="footer-logo">Lost & Found</h2>
          <p>
            Helping people reconnect with their lost belongings across campus.
          </p>
          <br />
          <h3 style={{ marginBottom: "4px", fontSize: "20px", fontWeight: "bold" }}>Contact</h3>
          <p>Email: <a href="mailto:support.lnf2026@gmail.com">support.lnf2026@gmail.com</a></p>
          <p>Made with ❤️ at IIT Kharagpur</p>
        </div>

        {/* MIDDLE */}
        <div className="footer-section">
          <h3 style={{ marginBottom: "8px", fontSize: "20px", fontWeight: "bold" }}>Quick Links</h3>
          <ul>
            <li><a onClick={() => {navigate("/"); window.scrollTo(0, 0);}}>Home</a></li>
            <li><a onClick={() => {navigate("/"); window.scrollTo(0, 0);}}>Browse Items</a></li>
            <li><a onClick={() => {navigate("/login"); window.scrollTo(0, 0);}}>Login / Sign Up</a></li>
            <li><a onClick={() => {navigate("/about"); window.scrollTo(0, 0);}}>About Us</a></li>
          </ul>
        </div>

        {/* RIGHT */}
        <div className="footer-section">
          
        </div>

      </div>

      {/* BOTTOM */}
      <div className="footer-bottom">
        <p>© 2026 Lost & Found. All rights reserved.</p>
      </div>

    </footer>
  );
};

export default Footer;