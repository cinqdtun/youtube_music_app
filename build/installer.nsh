!macro customInstall
  File "${BUILD_RESOURCES_DIR}\youtube_music_downloader.ico"
  WriteRegStr HKCU "Software\Classes\.mlist" "" "YML_mlist"
  WriteRegStr HKCU "Software\Classes\.mlist\Content Type" "" "application/x-mlist"
  WriteRegStr HKCU "Software\Classes\YML_mlist" "" "Music List File"
  WriteRegStr HKCU "Software\Classes\YML_mlist\DefaultIcon" "" "$INSTDIR\youtube_music_downloader.ico"
  WriteRegStr HKCU "Software\Classes\YML_mlist\shell\open\command" "" '"$INSTDIR\Youtube Music Downloader.exe" -o "%1"'
!macroend