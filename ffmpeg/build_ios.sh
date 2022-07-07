#!/bin/sh

# clean
rm -rf ios
rm -f config.h
rm -f ffbuild/.config
rm -f ffbuild/config.*

FAT=ios

SCRATCH=ios/scratch
# must be an absolute path
THIN=`pwd`/ios/thin

CONFIGURE_FLAGS="--enable-cross-compile"

ARCHS="armv7 arm64"

DEPLOYMENT_TARGET="8.0"

if [ ! `which yasm` ]
then
    echo 'Yasm not found'
    if [ ! `which brew` ]
    then
        echo 'Homebrew not found. Trying to install...'
                    ruby -e "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/master/install)" \
            || exit 1
    fi
    echo 'Trying to install Yasm...'
    brew install yasm || exit 1
fi
if [ ! `which gas-preprocessor.pl` ]
then
    echo 'gas-preprocessor.pl not found. Trying to install...'
    (curl -L https://github.com/libav/gas-preprocessor/raw/master/gas-preprocessor.pl \
        -o /usr/local/bin/gas-preprocessor.pl \
        && chmod +x /usr/local/bin/gas-preprocessor.pl) \
        || exit 1
fi

CWD=`pwd`

EXTERNAL="$CWD/../build/jsb-default/frameworks/cocos2d-x/external/ios"

for ARCH in $ARCHS
do
    echo "building $ARCH..."
    mkdir -p "$SCRATCH/$ARCH"
    cd "$SCRATCH/$ARCH"

    CFLAGS="-arch $ARCH"
    if [ "$ARCH" = "i386" -o "$ARCH" = "x86_64" ]
    then
        PLATFORM="iPhoneSimulator"
        CFLAGS="$CFLAGS -mios-simulator-version-min=$DEPLOYMENT_TARGET"
    else
        PLATFORM="iPhoneOS"
        CFLAGS="$CFLAGS -mios-version-min=$DEPLOYMENT_TARGET"
        if [ "$ARCH" = "arm64" ]
        then
            EXPORT="GASPP_FIX_XCODE5=1"
        fi
    fi

    XCRUN_SDK=`echo $PLATFORM | tr '[:upper:]' '[:lower:]'`
    CC="xcrun -sdk $XCRUN_SDK clang"

    # force "configure" to use "gas-preprocessor.pl" (FFmpeg 3.3)
    if [ "$ARCH" = "arm64" ]
    then
        AS="gas-preprocessor.pl -arch aarch64 -- $CC"
    else
        AS="gas-preprocessor.pl -- $CC"
    fi

    EXTERNAL_LIB=$EXTERNAL/libs
    OPENSSL_INCLUDE=$EXTERNAL/include
    X264_INCLUDE=$EXTERNAL/include/x264

    CXXFLAGS="$CFLAGS"
    LDFLAGS="$CFLAGS"
    if [ "$FDK_AAC" ]
    then
        CFLAGS="$CFLAGS -I$FDK_AAC/include"
        LDFLAGS="$LDFLAGS -L$FDK_AAC/lib"
    fi
    CFLAGS="$CFLAGS -I$OPENSSL_INCLUDE -I$X264_INCLUDE"
    LDFLAGS="$LDFLAGS -L$EXTERNAL_LIB"

    TMPDIR=${TMPDIR/%\/} $CWD/configure \
        --target-os=darwin \
        --arch=$ARCH \
        --cc="$CC" \
        --as="$AS" \
        $CONFIGURE_FLAGS \
        --extra-cflags="$CFLAGS" \
        --extra-cxxflags="$CFLAGS" \
        --extra-ldflags="$LDFLAGS" \
        --prefix="$THIN/$ARCH" \
        --enable-pic \
        --enable-nonfree \
        --enable-gpl \
        --enable-libx264 \
        --enable-openssl \
        --enable-neon \
        --enable-asm \
        --enable-inline-asm \
        --disable-iconv \
        --disable-avdevice \
        --disable-filters \
        --disable-stripping \
        --disable-doc \
        --disable-programs \
        --disable-symver \
        --disable-shared \
    || exit 1

    make clean
    make -j8 V=1 $EXPORT
    make install
    cd $CWD
done

echo "building fat binaries..."
mkdir -p $FAT/lib
set - $ARCHS
CWD=`pwd`
cd $THIN/arm64/lib
for LIB in *.a
do
    cd $CWD
    echo lipo -create `find $THIN -name $LIB` -output $FAT/lib/$LIB 1>&2
    lipo -create `find $THIN -name $LIB` -output $FAT/lib/$LIB || exit 1
done

cd $CWD
cp -rf $THIN/arm64/include $FAT

# copy static libraries and header files to cocos project

rm -rf $EXTERNAL/include/libavcodec
rm -rf $EXTERNAL/include/libavfilter
rm -rf $EXTERNAL/include/libavformat
rm -rf $EXTERNAL/include/libavutil
rm -rf $EXTERNAL/include/libswresample
rm -rf $EXTERNAL/include/libswscale
rm -rf $EXTERNAL/libs/libavcodec.a
rm -rf $EXTERNAL/libs/libavfilter.a
rm -rf $EXTERNAL/libs/libavformat.a
rm -rf $EXTERNAL/libs/libavutil.a
rm -rf $EXTERNAL/libs/libswresample.a
rm -rf $EXTERNAL/libs/libswscale.a

cp -r ios/include/libavcodec $EXTERNAL/include/libavcodec
cp -r ios/include/libavfilter $EXTERNAL/include/libavfilter
cp -r ios/include/libavformat $EXTERNAL/include/libavformat
cp -r ios/include/libavutil $EXTERNAL/include/libavutil
cp -r ios/include/libswresample $EXTERNAL/include/libswresample
cp -r ios/include/libswscale $EXTERNAL/include/libswscale

cp ios/lib/libavcodec.a $EXTERNAL/libs/libavcodec.a
cp ios/lib/libavfilter.a $EXTERNAL/libs/libavfilter.a
cp ios/lib/libavformat.a $EXTERNAL/libs/libavformat.a
cp ios/lib/libavutil.a $EXTERNAL/libs/libavutil.a
cp ios/lib/libswresample.a $EXTERNAL/libs/libswresample.a
cp ios/lib/libswscale.a $EXTERNAL/libs/libswscale.a

echo Done
