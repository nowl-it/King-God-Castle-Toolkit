# Maintainer: nowl <https://github.com/nowl-it>
pkgname=kgc-toolkit-git
pkgver=0.0.2
pkgrel=1
pkgdesc="King God Castle Toolkit"
arch=('x86_64')
url="https://github.com/nowl-it/King-God-Castle-Toolkit"
license=('MIT')
depends=('cairo' 'desktop-file-utils' 'gdk-pixbuf2' 'glib2' 'gtk3' 'hicolor-icon-theme' 'libsoup' 'pango' 'webkit2gtk-4.1')
makedepends=('git' 'openssl' 'appmenu-gtk-module' 'libappindicator-gtk3' 'librsvg' 'cargo' 'pnpm' 'nodejs')
provides=('kgc-toolkit')
conflicts=('kgc-toolkit' 'kgc-toolkit-git')
source=("git+${url}.git")
sha256sums=('SKIP')

pkgver() {
  cd King-God-Castle-Toolkit
  ( set -o pipefail
    git describe --long --abbrev=7 2>/dev/null | sed 's/\([^-]*-g\)/r\1/;s/-/./g' ||
    printf "r%s.%s" "$(git rev-list --count HEAD)" "$(git rev-parse --short=7 HEAD)"
  )
}

prepare() {
  cd King-God-Castle-Toolkit
  pnpm install
}

build() {
  cd King-God-Castle-Toolkit
  pnpm tauri build -b deb
}

package() {
  cp -a King-God-Castle-Toolkit/src-tauri/target/release/bundle/deb/kgc-toolkit_${pkgver}_*/data/* "${pkgdir}"
}
