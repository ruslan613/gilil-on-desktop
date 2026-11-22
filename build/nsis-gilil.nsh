; Gilil On NSIS hooks. Install pages are unchanged.
; customInstall runs after electron-builder has already created the desktop shortcut.
; customUnInstall runs after program files and the standard shortcut removal.

!macro customInstall
  ; Point that one shortcut at the in-app wordmark (default theme is dark).
  ; $newDesktopLink is "Gilil On.lnk" on the desktop, including paths with spaces.
  ${If} ${FileExists} "$newDesktopLink"
  ${AndIf} ${FileExists} "$INSTDIR\resources\icons\themes\gilil-on-dark.ico"
    CreateShortCut "$newDesktopLink" "$appExe" "" "$INSTDIR\resources\icons\themes\gilil-on-dark.ico" 0 "" "" "${APP_DESCRIPTION}"
    WinShell::SetLnkAUMI "$newDesktopLink" "${APP_ID}"
    ; SHCNE_UPDATEITEM + SHCNF_PATHW|SHCNF_FLUSH for this .lnk only.
    System::Call 'shell32::SHChangeNotify(i 0x2000, i 0x1005, w "$newDesktopLink", p 0)'
  ${EndIf}
!macroend

!macro customUnInstall
  ; Same shortcut name the installer and the app write. One file, not a second copy.
  Delete "$DESKTOP\Gilil On.lnk"
  ; Per-user data. gilil-on-data (database, WAL, server-startup.log) lives inside this folder.
  ${If} $installMode == "all"
    SetShellVarContext current
  ${EndIf}
  RMDir /r "$APPDATA\gilil-on-desktop"
  ${If} $installMode == "all"
    SetShellVarContext all
  ${EndIf}
!macroend
