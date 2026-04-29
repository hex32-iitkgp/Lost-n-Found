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
          <h3 style={{ marginBottom: "10px" }}>Contact</h3>
          <p>Email: support.lnf@gmail.com</p>
          <p>Made with ❤️ at IIT Kharagpur</p>
        </div>

        {/* MIDDLE */}
        <div className="footer-section">
          <h3 style={{ marginBottom: "8px" }}>Quick Links</h3>
          <ul>
            <li><a onClick={() => navigate("/")}>Home</a></li>
            <li><a onClick={() => navigate("/")}>Browse Items</a></li>
            <li><a onClick={() => navigate("/registration")}>Login / Sign Up</a></li>
            <li><a onClick={() => navigate("/home_board")}>About Us</a></li>
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