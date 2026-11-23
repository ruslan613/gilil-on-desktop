; Gilil On NSIS hooks. Install pages are unchanged.
; customInstall runs after electron-builder has already created the desktop shortcut.
; customUnInstall runs after program files and the standard shortcut removal.

!macro customInstall
  ; Desktop, Start menu, and Add/Remove Programs use the approved dark emblem.
  ; The Start menu shortcut otherwise keeps the exe's own icon.
  ${If} ${FileExists} "$INSTDIR\resources\icons\themes\gilil-on-dark.ico"
    CopyFiles /SILENT "$INSTDIR\resources\icons\themes\gilil-on-dark.ico" "$INSTDIR\uninstallerIcon.ico"
    ${If} ${FileExists} "$newDesktopLink"
      CreateShortCut "$newDesktopLink" "$appExe" "" "$INSTDIR\resources\icons\themes\gilil-on-dark.ico" 0 "" "" "${APP_DESCRIPTION}"
      WinShell::SetLnkAUMI "$newDesktopLink" "${APP_ID}"
      System::Call 'shell32::SHChangeNotify(i 0x2000, i 0x1005, w "$newDesktopLink", p 0)'
    ${EndIf}
    ${If} ${FileExists} "$newStartMenuLink"
      CreateShortCut "$newStartMenuLink" "$appExe" "" "$INSTDIR\resources\icons\themes\gilil-on-dark.ico" 0 "" "" "${APP_DESCRIPTION}"
      WinShell::SetLnkAUMI "$newStartMenuLink" "${APP_ID}"
      System::Call 'shell32::SHChangeNotify(i 0x2000, i 0x1005, w "$newStartMenuLink", p 0)'
    ${EndIf}
  ${EndIf}
!macroend

!macro customUnInstall
  ; Remove only the desktop shortcut. Leave %APPDATA%\gilil-on-desktop in place,
  ; including gilil-on-data, the database, and server-startup.log.
  Delete "$DESKTOP\Gilil On.lnk"
!macroend
