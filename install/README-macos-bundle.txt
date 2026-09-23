EigenTunnel sandbox leaf (macOS)

Use the installer for the OS where this node will run.
This pack is macOS only (Apple Silicon + Intel).

Brain-dead path:
1) Unzip this folder (eigen-leaf-macos-bundle).
2) Double-click "Activate EigenTunnel.command".

If macOS shows “Not Opened” / malware warning (common on newer Macs):
  a) Click Done (do NOT click Move to Trash).
  b) Open System Settings → Privacy & Security.
  c) Scroll down. Click Open Anyway next to Activate EigenTunnel.command.
  d) Confirm Open. The activate window should appear.

Older macOS fallback: right-click the .command → Open → Open.

Still stuck? Paste this one line in Terminal (Applications → Utilities → Terminal), then press Return:
  xattr -cr ~/Downloads/eigen-leaf-macos-bundle && open ~/Downloads/eigen-leaf-macos-bundle/Activate\ EigenTunnel.command
(If your unzip landed elsewhere, change ~/Downloads/... to that folder.)

3) Paste your activate link (or token) when prompted.
4) Accept the suggested node name, or type leaf-yourname.
5) Expect {"accepted":true}.

Manual path (same result):
   chmod +x activate-and-register.sh leaf-pack/install.sh
   ./activate-and-register.sh 'PASTE_TOKEN_FROM_ACTIVATE_PAGE' leaf-yourname

Your private key is created on this Mac and never uploaded.
Do not email peer.env or identity.key.
Only share the activate link/token.

After both leaves are on the gateway, open TESTING.txt for ping + echo prove steps
(shows the lab works and Eigen is fast). Do not email peer.env.

