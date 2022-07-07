#!/bin/bash

# environment variable
NDK=$ANDROID_NDK
HOST=arm-linux
SYSROOT=$NDK/toolchains/llvm/prebuilt/darwin-x86_64/sysroot
TOOLCHAIN_BIN=$NDK/toolchains/llvm/prebuilt/darwin-x86_64/bin

# clean
rm -rf android
rm -f config.h
rm -f ffbuild/.config
rm -f ffbuild/config.*

ARCHITECTURES="armeabi-v7a arm64-v8a"
for ARCHITECTURE in ${ARCHITECTURES};
do
    PREFIX=$(pwd)/android/$ARCHITECTURE
    EXTERNAL=../build/jsb-default/frameworks/cocos2d-x/external/android/$ARCHITECTURE
    if [[ ${ARCHITECTURE} == "armeabi-v7a" ]]; then
        ARCH=arm
        TARGET="armv7a-linux-androideabi16"
        AR=$TOOLCHAIN_BIN/arm-linux-androideabi-ar
        CC=$TOOLCHAIN_BIN/armv7a-linux-androideabi16-clang
        CXX=$TOOLCHAIN_BIN/armv7a-linux-androideabi16-clang++
        RANLIB=$TOOLCHAIN_BIN/arm-linux-androideabi-ranlib 
        STRIP=$TOOLCHAIN_BIN/arm-linux-androideabi-strip
    else
        ARCH=aarch64
        TARGET="aarch64-linux-android21"
        AR=$TOOLCHAIN_BIN/aarch64-linux-android-ar
        CC=$TOOLCHAIN_BIN/aarch64-linux-android21-clang
        CXX=$TOOLCHAIN_BIN/aarch64-linux-android21-clang++
        RANLIB=$TOOLCHAIN_BIN/aarch64-linux-android-ranlib
        STRIP=$TOOLCHAIN_BIN/aarch64-linux-android-strip
    fi

    FLAGS="--target=$TARGET -g -DANDROID -ffunction-sections -funwind-tables -fstack-protector-strong -no-canonical-prefixes -mfloat-abi=softfp -mfpu=vfpv3-d16 -mthumb -Wa,--noexecstack -Wformat -Werror=format-security -std=c99 -O0 -fPIC"
    INCLUDES="-I$SYSROOT/usr/include -isystem $SYSROOT/usr/include -isysroot $NDK/sysroot -I$EXTERNAL/include -I$EXTERNAL/include/x264"

    # configure
    ./configure \
    --prefix=$PREFIX \
    --enable-cross-compile \
    --target-os=android \
    --arch=$ARCH \
    --sysroot=$SYSROOT \
    --cc=$CC \
    --cxx=$CXX \
    --ar=$AR \
    --ranlib=$RANLIB \
    --strip=$STRIP \
    --extra-cflags="$FLAGS $INCLUDES" \
    --extra-ldflags="-std=c99 -lc -lm -lz -ldl -L$EXTERNAL -lssl -lcrypto -lx264" \
    --enable-static \
    --enable-small \
    --enable-openssl \
    --enable-asm \
    --enable-inline-asm \
    --enable-pic \
    --enable-nonfree \
    --enable-gpl \
    --enable-neon \
    --enable-libx264 \
    --enable-jni \
    --enable-mediacodec \
    --disable-iconv \
    --disable-stripping \
    --disable-avdevice \
    --disable-filters \
    --disable-doc \
    --disable-programs \
    --disable-symver \
    --disable-shared

    # build
    make clean
    make -j8 V=1
    make install

    rm -f android/$ARCHITECTURE/include/libavutil/time.h

    # copy static libraries and header files to cocos project
    rm -rf $EXTERNAL/include/libavcodec
    rm -rf $EXTERNAL/include/libavfilter
    rm -rf $EXTERNAL/include/libavformat
    rm -rf $EXTERNAL/include/libavutil
    rm -rf $EXTERNAL/include/libswresample
    rm -rf $EXTERNAL/include/libswscale

    cp -r android/$ARCHITECTURE/include/libavcodec $EXTERNAL/include/libavcodec
    cp -r android/$ARCHITECTURE/include/libavfilter $EXTERNAL/include/libavfilter
    cp -r android/$ARCHITECTURE/include/libavformat $EXTERNAL/include/libavformat
    cp -r android/$ARCHITECTURE/include/libavutil $EXTERNAL/include/libavutil
    cp -r android/$ARCHITECTURE/include/libswresample $EXTERNAL/include/libswresample
    cp -r android/$ARCHITECTURE/include/libswscale $EXTERNAL/include/libswscale

    rm -rf $EXTERNAL/libavcodec.a
    rm -rf $EXTERNAL/libavfilter.a
    rm -rf $EXTERNAL/libavformat.a
    rm -rf $EXTERNAL/libavutil.a
    rm -rf $EXTERNAL/libswresample.a
    rm -rf $EXTERNAL/libswscale.a

    cp android/$ARCHITECTURE/lib/libavcodec.a $EXTERNAL/libavcodec.a
    cp android/$ARCHITECTURE/lib/libavfilter.a $EXTERNAL/libavfilter.a
    cp android/$ARCHITECTURE/lib/libavformat.a $EXTERNAL/libavformat.a
    cp android/$ARCHITECTURE/lib/libavutil.a $EXTERNAL/libavutil.a
    cp android/$ARCHITECTURE/lib/libswresample.a $EXTERNAL/libswresample.a
    cp android/$ARCHITECTURE/lib/libswscale.a $EXTERNAL/libswscale.a

done

