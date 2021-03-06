/*
 * KNWebGLShader.js
 * Keynote HTML Player
 *
 * Created by Tungwei Cheng
 * Copyright (c) 2016-2018 Apple Inc. All rights reserved.
 */

var KNWebGLShader = {};

KNWebGLShader.defaultTexture = {
    attribNames: ["Position", "TexCoord"],
    uniformNames: ["MVPMatrix", "Texture"],
    vertex: "\
        #ifdef GL_ES\n\
        precision highp float;\n\
        #endif\n\
        uniform mat4    MVPMatrix;\n\
        attribute vec4  Position;\n\
        attribute vec2  TexCoord;\n\
        varying vec2 v_TexCoord;\n\
        void main()\n\
        {\n\
            v_TexCoord = TexCoord;\n\
            gl_Position = (MVPMatrix * Position);\n\
        }\
        ",
    fragment: "\
        #ifdef GL_ES\n\
        precision mediump float;\n\
        #endif\n\
        uniform sampler2D Texture;\n\
        varying vec2 v_TexCoord;\n\
        void main()\n\
        {\n\
            gl_FragColor = texture2D(Texture, v_TexCoord);\n\
        }\
        "
};

KNWebGLShader.defaultTextureAndOpacity = {
    attribNames: ["Position", "TexCoord"],
    uniformNames: ["MVPMatrix", "Texture", "Opacity"],
    vertex: "\
        #ifdef GL_ES\n\
        precision highp float;\n\
        #endif\n\
        uniform mat4    MVPMatrix;\n\
        attribute vec4  Position;\n\
        attribute vec2  TexCoord;\n\
        varying vec2 v_TexCoord;\n\
        void main()\n\
        {\n\
            v_TexCoord = TexCoord;\n\
            gl_Position = (MVPMatrix * Position);\n\
        }\
        ",
    fragment: "\
        #ifdef GL_ES\n\
        precision mediump float;\n\
        #endif\n\
        uniform sampler2D Texture;\n\
        uniform float Opacity;\n\
        varying vec2 v_TexCoord;\n\
        void main()\n\
        {\n\
            vec4 texColor = texture2D(Texture, v_TexCoord);\n\
            gl_FragColor = vec4(Opacity) * texColor;\n\
        }\
        "
};

KNWebGLShader.contents = {
    attribNames: ["Position", "TexCoord"],
    uniformNames: ["MVPMatrix", "Texture", "Texture2", "mixFactor"],
    vertex: "\
        #ifdef GL_ES\n\
        precision highp float;\n\
        #endif\n\
        uniform mat4 MVPMatrix;\n\
        attribute vec4 Position;\n\
        attribute vec2 TexCoord;\n\
        varying vec2 v_TexCoord;\n\
        void main()\n\
        {\n\
            v_TexCoord = TexCoord;\n\
            gl_Position = (MVPMatrix * Position);\n\
        }\
        ",
    fragment: "\
        #ifdef GL_ES\n\
        precision mediump float;\n\
        #endif\n\
        uniform sampler2D Texture;\n\
        uniform sampler2D Texture2;\n\
        uniform float mixFactor;\n\
        varying vec2 v_TexCoord;\n\
        void main()\n\
        {\n\
            vec4 outgoingColor = texture2D(Texture2, v_TexCoord);\n\
            vec4 incomingColor = texture2D(Texture, v_TexCoord);\n\
            vec4 result = mix(outgoingColor, incomingColor, mixFactor);\n\
            gl_FragColor = result;\n\
        }\
        "
};

KNWebGLShader.iris = {
    attribNames: ["Position", "TexCoord"],
    uniformNames: ["PercentForAlpha", "Scale", "Mix", "Texture", "MVPMatrix", "Opacity"],
    vertex: "\
        #ifdef GL_ES\n\
        precision highp float;\n\
        #endif\n\
        uniform mat4    MVPMatrix;\n\
        attribute vec4  Position;\n\
        attribute vec2  TexCoord;\n\
        varying vec2 v_TexCoord;\n\
        void main()\n\
        {\n\
            v_TexCoord = TexCoord;\n\
            gl_Position = MVPMatrix * Position;\n\
        }\
        ",
    fragment: "\
        #ifdef GL_ES\n\
            precision mediump float;\n\
        #endif\n\
        uniform sampler2D Texture;\n\
        uniform float Opacity;\n\
        uniform float PercentForAlpha;\n\
        uniform float Scale;\n\
        uniform float Mix;\n\
        varying vec2 v_TexCoord;\n\
        void main()\n\
        {\n\
            vec4 incomingTexColor = texture2D(Texture, v_TexCoord);\n\
            vec4 clear = vec4(0.0, 0.0, 0.0, 0.0);\n\
            float tolerance = PercentForAlpha/5.0;\n\
            vec2 powers = vec2((v_TexCoord.x - 0.5) * Scale,v_TexCoord.y - 0.5);\n\
            powers *= powers;\n\
            float radiusSqrd = PercentForAlpha * PercentForAlpha;\n\
            float dist =  (powers.x+powers.y)/((0.5*Scale)*(0.5*Scale)+0.25);\n\
            float gradient = smoothstep(radiusSqrd, radiusSqrd+tolerance, dist);\n\
            gl_FragColor = vec4(Opacity) * mix(clear, incomingTexColor, abs(Mix - gradient));\n\
        }\
        "
};

KNWebGLShader.twist = {
    attribNames: ["Position", "TexCoord", "Normal"],
    uniformNames: ["TextureMatrix", "SpecularColor", "FlipNormals", "MVPMatrix", "Texture"],
    vertex: "\
        #ifdef GL_ES\n\
            precision highp float;\n\
        #endif\n\
        uniform mat4 MVPMatrix;\n\
        uniform mat3 TextureMatrix;\n\
        uniform float SpecularColor;\n\
        uniform mediump float FlipNormals;\n\
        attribute vec3 Position;\n\
        attribute vec3 Normal;\n\
        attribute vec2 TexCoord;\n\
        varying vec2 v_TexCoord;\n\
        varying vec3 v_DiffuseColor;\n\
        varying vec3 v_SpecularColor;\n\
        const vec3 c_AmbientColor = vec3(0.2);\n\
        const vec3 c_DiffuseColor = vec3(1);\n\
        const float c_LightExponent = 32.0;\n\
        const vec3 c_LightDirection = vec3(0.1580, +0.5925, 0.7900);\n\
        const vec3 c_LightHalfPlane = vec3(0.0835, +0.3131, 0.9460);\n\
        void main()\n\
        {\n\
            vec3 thisNormal = Normal * FlipNormals;\n\
            // Lighting\n\
            float ndotl = max(0.0, dot(thisNormal, c_LightDirection));\n\
            float ndoth = max(0.0, dot(thisNormal, c_LightHalfPlane));\n\
            v_DiffuseColor = (c_AmbientColor + ndotl * c_DiffuseColor);\n\
            v_SpecularColor = (ndoth <= 0.0) ? vec3(0) : (pow(ndoth, c_LightExponent) * vec3(SpecularColor));\n\
            gl_Position = MVPMatrix * vec4(Position, 1.0);\n\
            v_TexCoord = (TextureMatrix * vec3(TexCoord,1.0)).xy;\n\
        }\
        ",
    fragment: "\
        #ifdef GL_ES\n\
            precision mediump float;\n\
        #endif\n\
        uniform sampler2D Texture;\n\
        varying vec2 v_TexCoord;\n\
        varying vec3 v_DiffuseColor;\n\
        varying vec3 v_SpecularColor;\n\
        void main()\n\
        {\n\
            vec4 texColor = texture2D(Texture, v_TexCoord);\n\
            // Lighting\n\
            texColor.xyz = texColor.xyz * v_DiffuseColor + v_SpecularColor;\n\
            gl_FragColor = texColor;\n\
        }\
        "
};

KNWebGLShader.colorPlanes = {
    attribNames: ["Position", "TexCoord"],
    uniformNames: ["MVPMatrix", "FlipTexCoords", "Texture", "ColorMask"],
    vertex: "\
        #ifdef GL_ES\n\
            precision highp float;\n\
        #endif\n\
        uniform mat4 MVPMatrix;\n\
        uniform vec2 FlipTexCoords;\n\
        attribute vec2 Position;\n\
        attribute vec2 TexCoord;\n\
        varying vec2 v_TexCoord;\n\
        void main()\n\
        {\n\
            v_TexCoord = vec2(FlipTexCoords.x == 0.0 ? TexCoord.x : 1.0-TexCoord.x, FlipTexCoords.y == 0.0 ? TexCoord.y : 1.0-TexCoord.y);\n\
            gl_Position = MVPMatrix * vec4(Position, 0,1);\n\
        }\
        ",
    fragment: "\
        #ifdef GL_ES\n\
            precision mediump float;\n\
        #endif\n\
        uniform sampler2D Texture;\n\
        uniform vec4 ColorMask;\n\
        varying vec2 v_TexCoord;\n\
        void main()\n\
        {\n\
            vec4 texColor = texture2D(Texture, v_TexCoord);\n\
            texColor *= ColorMask;\n\
            gl_FragColor = texColor;\n\
        }\
        "
};

KNWebGLShader.flop = {
    attribNames: ["Position", "TexCoord", "Normal"],
    uniformNames: ["TextureMatrix", "FlipNormals", "MVPMatrix", "Texture"],
    vertex: "\
        \n\
        #ifdef GL_ES\n\
        precision highp float;\n\
        #endif\n\
        \n\
        uniform mat4 MVPMatrix;\n\
        uniform mat3 TextureMatrix;\n\
        uniform float FlipNormals;\n\
        \n\
        attribute vec3 Position;\n\
        attribute vec3 Normal;\n\
        attribute vec2 TexCoord;\n\
        \n\
        varying vec2 v_TexCoord;\n\
        varying vec3 v_DiffuseColor;\n\
        \n\
        const vec3 c_AmbientColor = vec3(0.1);\n\
        const vec3 c_DiffuseColor = vec3(1);\n\
        const float c_LightExponent = 32.0;\n\
        \n\
        const vec3 c_LightDirection = vec3(0.000, +0.000, 0.900);\n\
        \n\
        void main()\n\
        {\n\
            vec3 thisNormal = Normal * FlipNormals;\n\
            \n\
            // Lighting\n\
            vec3 lightDirection = vec3(c_LightDirection.x,c_LightDirection.y,c_LightDirection.z);\n\
            \n\
            float ndotl = max(0.0, dot(thisNormal, lightDirection));\n\
            \n\
            v_DiffuseColor = (c_AmbientColor + ndotl * c_DiffuseColor);\n\
            \n\
            gl_Position = MVPMatrix * vec4(Position, 1);\n\
            v_TexCoord = (TextureMatrix * vec3(TexCoord,1)).xy;\n\
        }\
        ",
    fragment: "\
        \n\
        #ifdef GL_ES\n\
        precision mediump float;\n\
        #endif\n\
        \n\
        uniform sampler2D Texture;\n\
        \n\
        varying vec2 v_TexCoord;\n\
        varying vec3 v_DiffuseColor;\n\
        \n\
        void main()\n\
        {\n\
            vec4 texColor = texture2D(Texture, v_TexCoord);\n\
            \n\
            // Lighting\n\
            texColor.xyz = texColor.xyz * v_DiffuseColor;\n\
            gl_FragColor = texColor;\n\
        }\
        "
};

KNWebGLShader.anvilsmoke = {
    attribNames: ["Rotation", "Speed", "Scale", "LifeSpan", "ParticleTexCoord", "Center", "Position"],
    uniformNames: ["Percent", "Opacity", "ParticleTexture", "MVPMatrix"],
    vertex: "\
        \n\
        uniform mat4    MVPMatrix;\n\
        uniform float   Percent;\n\
        uniform float   Opacity;\n\
        \n\
        attribute vec2  Position;\n\
        attribute vec2  Center;\n\
        attribute vec2  ParticleTexCoord;\n\
        attribute vec3  Rotation;\n\
        attribute vec3  Speed;\n\
        attribute float Scale;\n\
        attribute vec2  LifeSpan;\n\
        \n\
        varying vec4    v_Color;\n\
        varying vec2    v_TexCoord;\n\
        \n\
        const float Pi = 3.1415926;\n\
        const float Pi_2 = 1.5707963;\n\
        const float TwoPi = 6.2831852;\n\
        \n\
        const float sineConstB = 1.2732396; /* = 4./Pi; */\n\
        const float sineConstC = -0.40528476; /* = -4./(Pi*Pi); */\n\
        \n\
        vec3 fastSine(vec3 angle)\n\
        {\n\
            vec3 theAngle = mod(angle + Pi, TwoPi) - Pi;\n\
            return sineConstB * theAngle + sineConstC * theAngle * abs(theAngle);\n\
        }\n\
        \n\
        mat3 fastRotationMatrix(vec3 theRotation)\n\
        {\n\
            vec3 sinXYZ = fastSine(theRotation);\n\
            vec3 cosXYZ = fastSine(Pi_2 - theRotation);\n\
            mat3 rotMatrix = mat3( cosXYZ.y*cosXYZ.z,  sinXYZ.x*sinXYZ.y*cosXYZ.z+cosXYZ.x*sinXYZ.z, -cosXYZ.x*sinXYZ.y*cosXYZ.z+sinXYZ.x*sinXYZ.z,\n\
                -cosXYZ.y*sinXYZ.z, -sinXYZ.x*sinXYZ.y*sinXYZ.z+cosXYZ.x*cosXYZ.z,  cosXYZ.x*sinXYZ.y*sinXYZ.z+sinXYZ.x*cosXYZ.z,\n\
                sinXYZ.y, -sinXYZ.x*cosXYZ.y, cosXYZ.x*cosXYZ.y);\n\
            return rotMatrix;\n\
        }\n\
        \n\
        void main()\n\
        {\n\
            float realPercent = (Percent-LifeSpan.x)/LifeSpan.y;\n\
                 realPercent = clamp(realPercent, 0.0, 1.0);\n\
            realPercent = sqrt(realPercent);\n\
            \n\
            /* SCALE */\n\
            vec4 originalPosition = vec4(Position,0,1);\n\
            vec4 center = vec4(Center, 0,1);\n\
            vec3 scaleDirectionVec = vec3(originalPosition.xy-center.xy,0) * Scale * mix(0.1, 1.0, realPercent);\n\
            \n\
            /* ROTATE */\n\
            mat3 rotMatrix = fastRotationMatrix(Rotation * realPercent);\n\
            vec3 rotatedVec = rotMatrix * scaleDirectionVec;\n\
            vec4 position = center + vec4(rotatedVec,0);\n\
            \n\
            float speedAdjust = realPercent;\n\
            vec3 thisSpeed = Speed;\n\
            thisSpeed.x *= sqrt(realPercent);\n\
            thisSpeed.y *= realPercent*realPercent;\n\
            position += vec4(thisSpeed, 0);\n\
            \n\
            float thisOpacity = Opacity;\n\
            thisOpacity *= (1.0 - realPercent); /* fade out gradually */\n\
            thisOpacity *= min(1.0, realPercent*20.0);  /* fade in quickly */\n\
            \n\
            /* output */\n\
            gl_Position = MVPMatrix * position;\n\
            //v_Color = vec4(1.0, 1.0, 1.0, thisOpacity); //we applied a fix here, might not work everywhere\n\
            v_Color = vec4(thisOpacity);\n\
            v_TexCoord = ParticleTexCoord;\n\
        }\n\
        ",
    fragment: "\
        \n\
        #ifdef GL_ES\n\
            precision mediump float;\n\
        #endif\n\
        uniform sampler2D ParticleTexture;\n\
        \n\
        varying vec4 v_Color;\n\
        varying vec2 v_TexCoord;\n\
        \n\
        void main()\n\
        {\n\
            vec4 texColor = texture2D(ParticleTexture, v_TexCoord);\n\
            \n\
            texColor *= v_Color;\n\
            \n\
            gl_FragColor = texColor;\n\
        }\n\
        "
};

KNWebGLShader.anvilspeck = {
    attribNames: ["Speed", "Scale", "LifeSpan", "ParticleTexCoord", "Center", "Position"],
    uniformNames: ["Percent", "Opacity", "ParticleTexture", "MVPMatrix"],
    vertex: "\
        \n\
        uniform mat4    MVPMatrix;\n\
        uniform float   Percent;\n\
        uniform float   Opacity;\n\
        \n\
        attribute vec2  Position;\n\
        attribute vec2  Center;\n\
        attribute vec2  ParticleTexCoord;\n\
        attribute vec3  Speed;\n\
        attribute float Scale;\n\
        attribute vec2  LifeSpan;\n\
        \n\
        varying vec4    v_Color;\n\
        varying vec2    v_TexCoord;\n\
        \n\
        const float Pi = 3.1415926;\n\
        const float Pi_2 = 1.5707963;\n\
        const float TwoPi = 6.2831852;\n\
        \n\
        const float sineConstB = 1.2732396; /* = 4./Pi; */\n\
        const float sineConstC = -0.40528476; /* = -4./(Pi*Pi); */\n\
        \n\
        vec3 fastSine(vec3 angle)\n\
        {\n\
            vec3 theAngle = mod(angle + Pi, TwoPi) - Pi;\n\
            return sineConstB * theAngle + sineConstC * theAngle * abs(theAngle);\n\
        }\n\
        \n\
        void main()\n\
        {\n\
            float realPercent = (Percent-LifeSpan.x)/LifeSpan.y;\n\
            realPercent = clamp(realPercent, 0.0, 1.0);\n\
            \n\
            /* SCALE */\n\
            vec4 originalPosition = vec4(Position,0,1);\n\
            vec4 center = vec4(Center, 0,1);\n\
            vec3 thisScale = Scale * vec3(1, Speed.z, 1) * mix(0.1, 1.0, realPercent);\n\
            vec3 scaleDirectionVec = vec3(originalPosition.xy-center.xy,0) * thisScale;\n\
            \n\
            vec4 position = center + vec4(scaleDirectionVec,0);\n\
            \n\
            float speedAdjust = realPercent;\n\
            vec3 thisPos = vec3(Speed.x * realPercent,\n\
                Speed.y * fastSine(Pi*0.85*vec3(realPercent,0,0)).x, /* arc with gravity */\n\
                0);\n\
            position += vec4(thisPos, 0);\n\
            \n\
            float thisOpacity = Opacity;\n\
            thisOpacity *= (1.0 - realPercent); /* fade out gradually */\n\
            thisOpacity *= min(1.0, realPercent*20.0);  /* fade in quickly */\n\
            \n\
            /* output */\n\
            gl_Position = MVPMatrix * position;\n\
            v_Color = vec4(thisOpacity);\n\
            v_TexCoord = ParticleTexCoord;\n\
        }\
        ",
    fragment: "\
        \n\
        #ifdef GL_ES\n\
            precision mediump float;\n\
        #endif\n\
        uniform sampler2D ParticleTexture;\n\
        \n\
        varying vec4 v_Color;\n\
        varying vec2 v_TexCoord;\n\
        \n\
        void main()\n\
        {\n\
            vec4 texColor = texture2D(ParticleTexture, v_TexCoord);\n\
            \n\
            texColor *= v_Color;\n\
            \n\
            gl_FragColor = texColor;\n\
        }\
        "
};

KNWebGLShader.flame = {
    attribNames: ["Rotation", "Speed", "LifeSpan", "ParticleTexCoord", "Center", "Position"],
    uniformNames: ["Percent", "Duration", "Opacity", "RotationMax", "SpeedMax", "ParticleTexture", "MVPMatrix"],
    vertex: "\
        \n\
        precision highp float;\n\
        \n\
        uniform mat4 MVPMatrix;\n\
        uniform float Percent;\n\
        uniform float Duration;\n\
        \n\
        attribute vec3 Rotation;\n\
        attribute vec3 Speed;\n\
        uniform float   Opacity;\n\
        attribute vec2 LifeSpan;\n\
        attribute vec2 ParticleTexCoord;\n\
        attribute vec2  Position;\n\
        attribute vec2  Center;\n\
        \n\
        uniform mediump float RotationMax;\n\
        uniform mediump float SpeedMax;\n\
        \n\
        varying vec4 v_Color;\n\
        varying vec2 v_TexCoord;\n\
        \n\
        const float Pi = 3.1415926;\n\
        const float Pi_2 = 1.5707963;\n\
        const float TwoPi = 6.2831852;\n\
        \n\
        const float sineConstB = 1.2732396; /* = 4./Pi; */\n\
        const float sineConstC = -0.40528476; /* = -4./(Pi*Pi); */\n\
        \n\
        float fastSine(float angle)\n\
        {\n\
            float theAngle = mod(angle + Pi, TwoPi) - Pi;\n\
            return sineConstB * theAngle + sineConstC * theAngle * abs(theAngle);\n\
        }\n\
        \n\
        const vec4 kStartColor = vec4( 1.0,  1.0, 1.0,  0.0 ); /* white */\n\
        const vec4 kMidColor   = vec4( 0.97, 1.0, 0.32, 0.0 ); /* yellow */\n\
        const vec4 kEndColor   = vec4( 0.9,  0.0, 0.0,  0.0 ); /* red */\n\
        const float kColorMidPoint   = 0.1;\n\
        \n\
        vec4 flameColor(float aPercent)\n\
        {\n\
            float thePercent = aPercent;\n\
            /* CONSTANTS */\n\
            float beginCutoff = 0.4/Duration;    /* start slow (not bright white) */\n\
            float smokeCutoff = 1.0 - (0.95/Duration);      /* end with black, basically */\n\
            float alphaCutoff = 1.0 - 0.5/Duration;    /* fade out towards the end */\n\
            \n\
            float alpha = (thePercent < alphaCutoff) ? 1.0 : (1.0-(thePercent-alphaCutoff)/(1.0-alphaCutoff));\n\
            vec4 theColor = vec4(0,0,0, alpha * 0.75);\n\
            \n\
            if (Percent < beginCutoff) {\n\
                float colorCutoff = beginCutoff*3.0;\n\
                thePercent += mix(colorCutoff, 0.0, Percent/beginCutoff);\n\
            }\n\
            \n\
            if (thePercent < kColorMidPoint) {\n\
                float newPercent = thePercent/kColorMidPoint;\n\
                theColor += mix(kStartColor, kMidColor, newPercent);\n\
            } else {\n\
                float newPercent = (thePercent-kColorMidPoint)/(1.0-kColorMidPoint);\n\
                theColor += mix(kMidColor, kEndColor, newPercent);\n\
            }\n\
            \n\
            if (Percent > smokeCutoff) {\n\
                /* smoke */\n\
                float smokeAmount = (Percent - smokeCutoff)/(1.0 - smokeCutoff);\n\
                smokeAmount = sqrt(smokeAmount);\n\
                smokeAmount *= (0.25+thePercent*thePercent);\n\
                theColor = vec4(theColor.rgb * max(0.0, 1.0-smokeAmount), theColor.a);\n\
            }\n\
            \n\
            return theColor;\n\
        }\n\
        \n\
        void main()\n\
        {\n\
            float realPercent = (Percent-LifeSpan.x)/LifeSpan.y;\n\
            bool shouldDiscard = realPercent < 0.0 || realPercent > 1.0;\n\
            realPercent = clamp(realPercent, 0.0, 1.0);\n\
            \n\
            vec4 scaleDirectionVec = vec4(Position-Center,0,0);\n\
            \n\
            /* ROTATE */\n\
            float halfPercent = realPercent/2.0;\n\
            vec3 thisRotation = Rotation * RotationMax;\n\
            float theRotation = thisRotation.x + thisRotation.z * (halfPercent * (halfPercent + 1.0));\n\
            float sinRot = fastSine(theRotation);\n\
            float cosRot = fastSine(Pi_2 - theRotation);\n\
            mat3 rotMatrix = mat3(cosRot,-sinRot,0,  sinRot,cosRot,0,  0,0,1);\n\
            vec3 rotatedVec = rotMatrix * scaleDirectionVec.xyz;\n\
            \n\
            /* SCALE */\n\
            float scaleAdjust = (0.1 + 1.0-(1.0-realPercent)*(1.0-realPercent));\n\
            vec4 position =  vec4(Center,0,1) + vec4(rotatedVec * scaleAdjust * (shouldDiscard ? 0.001 : 1.0), 0);\n\
            \n\
            /* POSITION */\n\
            vec3 thisSpeed = Speed * SpeedMax;\n\
            vec4 upVector = vec4(0.0, realPercent*realPercent * -thisSpeed.y, 0.0, 0.0);\n\
            position += upVector;\n\
            \n\
            v_Color = flameColor(realPercent)*Opacity;\n\
            gl_Position = MVPMatrix * position;\n\
            v_TexCoord = ParticleTexCoord;\n\
        }\
        ",
    fragment: "\
        \n\
        #ifdef GL_ES\n\
            precision mediump float;\n\
        #endif\n\
        uniform sampler2D ParticleTexture;\n\
        \n\
        varying vec4 v_Color;\n\
        varying vec2 v_TexCoord;\n\
        \n\
        void main()\n\
        {\n\
            vec4 texColor = texture2D(ParticleTexture, v_TexCoord);\n\
            \n\
            texColor *= v_Color;\n\
            \n\
            gl_FragColor = texColor;\n\
        }\n\
        "
};

KNWebGLShader.confetti = {
    attribNames: ["Rotation", "Speed", "TexCoord", "Center", "Position"],
    uniformNames: ["Percent", "Opacity", "ParticleTexture", "MVPMatrix"],
    vertex: "\
        \n\
        precision highp float;\n\
        uniform mat4 MVPMatrix;\n\
        \n\
        uniform float   Percent;\n\
        uniform mediump float Opacity;\n\
        \n\
        attribute vec2  Position;\n\
        attribute vec2  Center;\n\
        attribute vec2  TexCoord;\n\
        attribute vec3  Rotation;\n\
        attribute vec3  Speed;\n\
        \n\
        varying vec4    v_Color;\n\
        varying vec2    v_TexCoord;\n\
        \n\
        const float Pi = 3.1415926;\n\
        const float Pi_2 = 1.5707963;\n\
        const float TwoPi = 6.2831852;\n\
        \n\
        const float sineConstB = 1.2732396;\n\
        const float sineConstC = -0.40528476;\n\
        \n\
        vec3 fastSine(vec3 angle)\n\
        {\n\
            vec3 theAngle = mod(angle + Pi, TwoPi) - Pi;\n\
                return sineConstB * theAngle + sineConstC * theAngle * abs(theAngle);\n\
        }\n\
        \n\
        mat3 fastRotationMatrix(vec3 theRotation)\n\
        {\n\
            vec3 sinXYZ = fastSine(theRotation);\n\
            vec3 cosXYZ = fastSine(Pi_2 - theRotation);\n\
            mat3 rotMatrix = mat3( cosXYZ.y*cosXYZ.z,  sinXYZ.x*sinXYZ.y*cosXYZ.z+cosXYZ.x*sinXYZ.z, -cosXYZ.x*sinXYZ.y*cosXYZ.z+sinXYZ.x*sinXYZ.z,\n\
                -cosXYZ.y*sinXYZ.z, -sinXYZ.x*sinXYZ.y*sinXYZ.z+cosXYZ.x*cosXYZ.z,  cosXYZ.x*sinXYZ.y*sinXYZ.z+sinXYZ.x*cosXYZ.z,\n\
                sinXYZ.y, -sinXYZ.x*cosXYZ.y, cosXYZ.x*cosXYZ.y);\n\
            return rotMatrix;\n\
        }\n\
        \n\
        void main()\n\
        {\n\
            /* SCALE */\n\
            vec4 originalPosition = vec4(Position, 0, 1);\n\
            vec3 scaleDirectionVec = vec3(Position-Center,0);\n\
            \n\
            /* ROTATE */\n\
            mat3 rotMatrix = fastRotationMatrix(Rotation * Percent);\n\
            vec3 rotatedVec = scaleDirectionVec * rotMatrix;\n\
            vec4 position = vec4(Center,0,1) + vec4(rotatedVec,0);\n\
            \n\
            float colorAdjust = abs((rotMatrix * vec3(0,0,1)).z);\n\
            \n\
            float speedAdjust = Percent;\n\
            position += vec4(Speed, 0) * speedAdjust;\n\
            \n\
            /* output */\n\
            gl_Position = MVPMatrix * position;\n\
            v_Color = vec4(vec3(colorAdjust), Opacity);\n\
            v_TexCoord = TexCoord;\n\
        }\
        ",
    fragment: "\
        \n\
        precision mediump float;\n\
        \n\
        uniform sampler2D ParticleTexture;\n\
        //uniform float Opacity;\n\
        \n\
        varying vec4 v_Color;\n\
        varying vec2 v_TexCoord;\n\
        \n\
        void main()\n\
        {\n\
            vec4 texColor = texture2D(ParticleTexture, v_TexCoord);\n\
            \n\
            texColor *= v_Color;\n\
            //texColor.a = Opacity;\n\
            \n\
            gl_FragColor = texColor;\n\
        }\
        "
};

KNWebGLShader.diffuse = {
    attribNames: ["Rotation", "Speed", "TexCoord", "Center", "Position", "LifeSpan"],
    uniformNames: ["Percent", "Opacity", "ParticleTexture", "MVPMatrix", "RotationMax", "SpeedMax"],
    vertex: "\
        \n\
        precision highp float;\n\
        \n\
        uniform mat4 MVPMatrix;\n\
        \n\
        uniform float   Percent;\n\
        uniform mediump float   Opacity;\n\
        \n\
        attribute vec2  Position;\n\
        attribute vec2  Center;\n\
        attribute vec2  TexCoord;\n\
        \n\
        attribute mediump vec3  Rotation;\n\
        uniform mediump float RotationMax;\n\
        attribute mediump vec3  Speed;\n\
        uniform mediump float SpeedMax;\n\
        attribute mediump vec2  LifeSpan;\n\
        \n\
        varying vec4    v_Color;\n\
        varying vec2    v_TexCoord;\n\
        \n\
        const float Pi = 3.1415926;\n\
        const float Pi_2 = 1.5707963;\n\
        const float TwoPi = 6.2831852;\n\
        \n\
        const float sineConstB = 1.2732396;\n\
        const float sineConstC = -0.40528476;\n\
        \n\
        vec3 fastSine(vec3 angle)\n\
        {\n\
            vec3 theAngle = mod(angle + Pi, TwoPi) - Pi;\n\
            return sineConstB * theAngle + sineConstC * theAngle * abs(theAngle);\n\
        }\n\
        \n\
        mat3 fastRotationMatrix(vec3 theRotation)\n\
        {\n\
            vec3 sinXYZ = fastSine(theRotation);\n\
            vec3 cosXYZ = fastSine(Pi_2 - theRotation);\n\
            mat3 rotMatrix = mat3( cosXYZ.y*cosXYZ.z,  sinXYZ.x*sinXYZ.y*cosXYZ.z+cosXYZ.x*sinXYZ.z, -cosXYZ.x*sinXYZ.y*cosXYZ.z+sinXYZ.x*sinXYZ.z,\n\
                                  -cosXYZ.y*sinXYZ.z, -sinXYZ.x*sinXYZ.y*sinXYZ.z+cosXYZ.x*cosXYZ.z,  cosXYZ.x*sinXYZ.y*sinXYZ.z+sinXYZ.x*cosXYZ.z,\n\
                                  sinXYZ.y, -sinXYZ.x*cosXYZ.y, cosXYZ.x*cosXYZ.y);\n\
            return rotMatrix;\n\
        }\n\
        \n\
        void main()\n\
        {\n\
            float realPercent = (Percent-LifeSpan.x)/LifeSpan.y;\n\
            float doDiscard = (realPercent > 1.0) ? 0.0 : 1.0;\n\
            realPercent = clamp(realPercent, 0.0,1.0);\n\
            float revPercent = 1.0-realPercent;\n\
            \n\
            //SCALE\n\
            vec4 originalPosition = vec4(Position, 0, 1);\n\
            vec3 scaleDirectionVec = vec3(Position-Center,0);\n\
            \n\
            //ROTATE\n\
            vec3 thisRotation = Rotation * RotationMax;\n\
            mat3 rotMatrix = fastRotationMatrix(thisRotation * realPercent);\n\
            vec3 rotatedVec = scaleDirectionVec * rotMatrix;\n\
            vec4 position = vec4(Center,0,1) + vec4(rotatedVec,0) * doDiscard;\n\
            \n\
            vec3 thisSpeed = Speed * SpeedMax;\n\
            float l2r = -thisSpeed.x/abs(thisSpeed.x);\n\
            float reverseVector = l2r*(thisSpeed.x+abs(thisSpeed.y)) * realPercent/8.0;\n\
            \n\
            float speedMultiplier = 1.-pow(revPercent, 2.0);\n\
            vec3 dist = thisSpeed * speedMultiplier;\n\
            dist.x += reverseVector;\n\
            position.xyz += dist;\n\
            \n\
            float colorAdjust = abs((rotMatrix * vec3(0,0,1)).z);\n\
            \n\
            //output\n\
            gl_Position = MVPMatrix * position;\n\
            v_Color = vec4(vec3(colorAdjust), 1) * (revPercent*Opacity);\n\
            v_TexCoord = TexCoord;\n\
        }\
        ",
    fragment: "\
        \n\
        precision mediump float;\n\
        \n\
        uniform sampler2D Texture;\n\
        uniform float Opacity;\n\
        \n\
        varying vec4 v_Color;\n\
        varying vec2 v_TexCoord;\n\
        \n\
        void main()\n\
        {\n\
            vec4 texColor = texture2D(Texture, v_TexCoord);\n\
            \n\
            texColor *= v_Color;\n\
            \n\
            gl_FragColor = texColor;\n\
        }\
       "
};

KNWebGLShader.fireworks = {
    attribNames: ["Color", "Speed", "LifeSpan", "Scale", "ParticleTexCoord", "Center", "Position"],
    uniformNames: ["Percent", "PreviousPercent", "Gravity", "StartScale", "ShouldSparkle", "SparklePeriod", "ParticleBurstTiming", "PreviousParticleBurstTiming", "SpeedMax", "ParticleTexture", "Opacity", "MVPMatrix"],
    vertex: "\
        \n\
        precision highp float;\n\
        \n\
        uniform mat4 MVPMatrix;\n\
        \n\
        uniform float   Percent;\n\
        uniform float   PreviousPercent;\n\
        uniform float   Gravity;\n\
        uniform float   StartScale;\n\
        uniform float   ShouldSparkle;\n\
        uniform float   SparklePeriod;\n\
        uniform float   ParticleBurstTiming;\n\
        uniform float   PreviousParticleBurstTiming;\n\
        uniform float   SpeedMax;\n\
        \n\
        attribute vec2  Position;\n\
        attribute vec2  Center;\n\
        attribute vec2  ParticleTexCoord;\n\
        \n\
        attribute vec4  Color;\n\
        attribute vec3  Speed;\n\
        attribute vec2  LifeSpan;\n\
        attribute float Scale;\n\
        \n\
        varying vec4 v_Color;\n\
        varying vec2 v_TexCoord;\n\
        \n\
        void main()\n\
        {\n\
            float realPercent = (Percent-LifeSpan.x)/LifeSpan.y;\n\
            realPercent = clamp(realPercent, 0.0, 1.0);\n\
            \n\
            float prevRealPercent = (PreviousPercent-LifeSpan.x)/LifeSpan.y;\n\
            prevRealPercent = clamp(prevRealPercent, 0.0,1.0);\n\
            \n\
            vec4 center = vec4(Center,0,1);\n\
            vec4 scaleDirectionVec = vec4(Position-Center,0,0);\n\
            \n\
            // TRANSLATE\n\
            vec3 translation = Speed * (SpeedMax * ParticleBurstTiming); // (1.0-pow(1.0-realPercent, ExplosionPower));\n\
            translation.y -= Gravity * (Percent - LifeSpan.x); // Gravity is in terms of global percent, not particle system percent\n\
            \n\
            vec3 prevTranslation = Speed * (SpeedMax * PreviousParticleBurstTiming);\n\
            prevTranslation.y -= Gravity * (PreviousPercent - LifeSpan.x); // Gravity is in terms of global percent, not particle system percent\n\
            \n\
            vec3 blurOffset = translation - prevTranslation; // Blur in direction of velocity\n\
            \n\
            // project centerVec onto translationOffset to get direction\n\
            blurOffset *= (dot(blurOffset, scaleDirectionVec.xyz) >= 0.0 ? 1.0 : -1.0);\n\
            \n\
            center.xyz += translation;\n\
            \n\
            // SCALE\n\
            float scalePercent = (1.0-(1.0-realPercent)*(1.0-realPercent));\n\
            float scaleAdjust = mix(StartScale, Scale, scalePercent);\n\
            // scale down to zero, unless we're sparkling\n\
            scaleAdjust *= (ShouldSparkle>0.5 ? 0.25 : 1.0-scalePercent);\n\
            vec4 position = center + scaleDirectionVec * scaleAdjust;\n\
            position += vec4(blurOffset,0);\n\
            \n\
            // SPARKLE\n\
            float sparkleOpacity = fract(realPercent*realPercent * SparklePeriod);\n\
            sparkleOpacity = smoothstep(0.0, 1.0, sparkleOpacity);\n\
            \n\
            // COLOR\n\
            vec4 color = mix(vec4(1), Color, scalePercent * (ShouldSparkle<0.5 ? 1.0 : 0.5)); // white to color\n\
            color *= (ShouldSparkle<0.5 ? 1.0 : sparkleOpacity); // apply sparkle opacity\n\
            color *= (realPercent>=1.0 ? 0.0 : 1.0);\n\
            v_Color = color;\n\
            \n\
            gl_Position = MVPMatrix * position;\n\
            v_TexCoord = ParticleTexCoord;\n\
        }\
        ",
    fragment: "\
        \n\
        precision mediump float;\n\
        \n\
        uniform sampler2D ParticleTexture;\n\
        uniform float Opacity;\n\
        \n\
        varying vec4 v_Color;\n\
        varying vec2 v_TexCoord;\n\
        //varying float particleTexPercent;\n\
        \n\
        void main()\n\
        {\n\
            vec4 texColor = texture2D(ParticleTexture, v_TexCoord);\n\
            \n\
            texColor *= v_Color * Opacity;\n\
            //texColor.a *= Opacity;\n\
            \n\
            //texColor = vec4(v_TexCoord, 0, 1);\n\
            \n\
            gl_FragColor = texColor;\n\
        }\
        "
};

KNWebGLShader.fireworkstrails = {
    attribNames: [ "Position", "TexCoord"],
    uniformNames: ["Texture", "Opacity", "NoiseAmount", "NoiseSeed", "NoiseMax", "MVPMatrix"],
    vertex: "\
        \n\
        precision highp float;\n\
        \n\
        uniform mat4 MVPMatrix;\n\
        \n\
        attribute vec2  Position;\n\
        attribute vec2  TexCoord;\n\
        \n\
        varying vec2 v_TexCoord;\n\
        \n\
        void main()\n\
        {\n\
            gl_Position = MVPMatrix * vec4(Position, 0,1);\n\
            v_TexCoord = TexCoord;\n\
        }\
        ",
    fragment: "\
        precision mediump float;\n\
        \n\
        uniform sampler2D Texture;\n\
        uniform float Opacity;\n\
        uniform float NoiseAmount;\n\
        uniform vec2 NoiseSeed;\n\
        uniform float NoiseMax;\n\
        \n\
        //varying vec4 v_Color;\n\
        varying vec2 v_TexCoord;\n\
        //varying float particleTexPercent;\n\
        \n\
        float rand(vec2 co){\n\
            return fract(sin(dot(co.xy ,vec2(12.9898,78.233))) * 43758.5453);\n\
        }\n\
        \n\
        float inverseSquare(float a) {\n\
            return 1.0-(1.0-a)*(1.0-a);\n\
        }\n\
        \n\
        void main()\n\
        {\n\
            vec4 texColor = texture2D(Texture, v_TexCoord);\n\
            \n\
            //texColor = bloom(texColor);\n\
            \n\
            // Dither transparency to add noise\n\
            float randomNoise = NoiseMax*rand(v_TexCoord*NoiseSeed);\n\
            float randomAmount = NoiseAmount * 1.5*max(0.0, texColor.a-0.3333);\n\
            \n\
            float thisOpacity = Opacity * mix(1.0, randomNoise, randomAmount);\n\
            texColor *= thisOpacity;\n\
            \n\
            //texColor = vec4(v_TexCoord, 0, 1);\n\
            \n\
            gl_FragColor = texColor;\n\
        }\
        "
};

KNWebGLShader.horizontalGaussianBlur = {
    attribNames: [ "Position"],
    uniformNames: ["Texture", "TextureSize", "MVPMatrix"],
    vertex: "\
        \n\
        precision highp float;\n\
        \n\
        uniform mat4 MVPMatrix;\n\
        \n\
        attribute vec2  Position;\n\
        \n\
        void main()\n\
        {\n\
            gl_Position = MVPMatrix * vec4(Position, 0, 1);\n\
        }\
        ",
    fragment: "\
        precision highp float;\n\
        \n\
        uniform sampler2D Texture;\n\
        uniform vec2 TextureSize;\n\
        \n\
        const vec2 offset1 = vec2(1.3846153846, 0);\n\
        const vec2 offset2 = vec2(3.2307692308, 0);\n\
        const float weight0 = 0.2270270270;\n\
        const float weight1 = 0.3162162162;\n\
        const float weight2 = 0.0702702703;\n\
        \n\
        void main()\n\
        {\n\
            vec4 color = texture2D(Texture, gl_FragCoord.xy*TextureSize) * weight0;\n\
            \n\
            color += texture2D(Texture, (gl_FragCoord.xy + offset1)*TextureSize) * weight1;\n\
            color += texture2D(Texture, (gl_FragCoord.xy - offset1)*TextureSize) * weight1;\n\
            \n\
            color += texture2D(Texture, (gl_FragCoord.xy + offset2)*TextureSize) * weight2;\n\
            color += texture2D(Texture, (gl_FragCoord.xy - offset2)*TextureSize) * weight2;\n\
            \n\
            gl_FragColor = color;\n\
        }\
        "
};

KNWebGLShader.verticalGaussianBlur = {
    attribNames: [ "Position"],
    uniformNames: ["Texture", "TextureSize", "MVPMatrix"],
    vertex: "\
        \n\
        precision highp float;\n\
        \n\
        uniform mat4 MVPMatrix;\n\
        \n\
        attribute vec2  Position;\n\
        \n\
        void main()\n\
        {\n\
            gl_Position = MVPMatrix * vec4(Position, 0, 1);\n\
        }\
        ",
    fragment: "\
        precision highp float;\n\
        \n\
        uniform sampler2D Texture;\n\
        uniform vec2 TextureSize;\n\
        \n\
        const vec2 offset1 = vec2(0, 1.3846153846);\n\
        const vec2 offset2 = vec2(0, 3.2307692308);\n\
        const float weight0 = 0.2270270270;\n\
        const float weight1 = 0.3162162162;\n\
        const float weight2 = 0.0702702703;\n\
        \n\
        void main()\n\
        {\n\
            vec4 color = texture2D(Texture, gl_FragCoord.xy*TextureSize) * weight0;\n\
            \n\
            color += texture2D(Texture, (gl_FragCoord.xy + offset1)*TextureSize) * weight1;\n\
            color += texture2D(Texture, (gl_FragCoord.xy - offset1)*TextureSize) * weight1;\n\
            \n\
            color += texture2D(Texture, (gl_FragCoord.xy + offset2)*TextureSize) * weight2;\n\
            color += texture2D(Texture, (gl_FragCoord.xy - offset2)*TextureSize) * weight2;\n\
            \n\
            gl_FragColor = color;\n\
        }\
        "
};

KNWebGLShader.bloom = {
    attribNames: [ "Position", "TexCoord"],
    uniformNames: ["Texture", "BlurTexture", "BloomAmount", "MVPMatrix"],
    vertex: "\
        \n\
        precision highp float;\n\
        \n\
        uniform mat4 MVPMatrix;\n\
        \n\
        attribute vec2  Position;\n\
        attribute vec2  TexCoord;\n\
        \n\
        varying vec2 v_TexCoord;\n\
        \n\
        void main()\n\
        {\n\
            v_TexCoord = TexCoord;\n\
            gl_Position = MVPMatrix * vec4(Position, 0, 1);\n\
        }\
        ",
    fragment: "\
        precision mediump float;\n\
        \n\
        uniform sampler2D Texture;\n\
        uniform sampler2D BlurTexture;\n\
        uniform float BloomAmount;\n\
        \n\
        varying vec2 v_TexCoord;\n\
        \n\
        void main()\n\
        {\n\
            vec4 color = texture2D(Texture, v_TexCoord);\n\
            vec4 blurColor = texture2D(BlurTexture, v_TexCoord);\n\
            \n\
            color += (blurColor + color) * BloomAmount;\n\
            gl_FragColor = color;\n\
        }\
        "
};

KNWebGLShader.shimmerObject = {
    attribNames: [ "Position", "Center", "TexCoord", "Color", "Speed"],
    uniformNames: ["Percent", "Opacity", "RotationMatrix", "SpeedMax", "Texture", "MVPMatrix"],
    vertex: "\
        \n\
        precision highp float;\n\
        \n\
        uniform mat4 MVPMatrix;\n\
        uniform float   Percent;\n\
        uniform float   Opacity;\n\
        \n\
        uniform mat3  RotationMatrix;\n\
        \n\
        attribute vec2  Position;\n\
        attribute vec2  Center;\n\
        attribute vec2  TexCoord;\n\
        attribute vec4  Color;\n\
        \n\
        attribute vec3    Speed;\n\
        uniform float    SpeedMax;\n\
        \n\
        varying vec4    v_Color;\n\
        varying vec2    v_TexCoord;\n\
        \n\
        void main()\n\
        {\n\
            float thisPercent = Percent;\n\
            float invPercent = 1.0-thisPercent;\n\
            float thisPercent2 = thisPercent*thisPercent;\n\
            \n\
            /* CENTER */\n\
            vec3 scaleDirectionVec = vec3((Position.x-Center.x),(Position.y-Center.y),0);\n\
            \n\
            /* ROTATE */\n\
            vec3 rotatedVec = RotationMatrix * scaleDirectionVec.xyz;\n\
            \n\
            /* SCALE */\n\
            float scale = invPercent;\n\
            vec4 position = vec4(Center.xy,0,1) + vec4(rotatedVec,0) * scale;\n\
            \n\
            vec3 thisSpeed = Speed * SpeedMax;\n\
            position.xyz += thisSpeed * thisPercent*(3.0 + mix(thisPercent2*thisPercent, 1.0-invPercent*invPercent, thisPercent2));\n\
            \n\
            vec4 outColor = Color;\n\
            outColor = vec4(Opacity);\n\
            \n\
            /* output */\n\
            gl_Position = MVPMatrix * position;\n\
            v_Color = outColor;\n\
            v_TexCoord = TexCoord;\n\
        }\n\
        ",
    fragment: "\
        precision mediump float;\n\
        \n\
        uniform sampler2D Texture;\n\
        \n\
        varying vec4 v_Color;\n\
		varying vec2 v_TexCoord;\n\
        \n\
        void main()\n\
        {\n\
            vec4 color = texture2D(Texture, v_TexCoord);\n\
            \n\
            color *= v_Color;\n\
            \n\
            gl_FragColor = color;\n\
        }\
        "
};

KNWebGLShader.shimmerParticle = {
    attribNames: [ "Position", "Center", "ParticleTexCoord", "Color", "LifeSpan", "Speed", "Scale"],
    uniformNames: ["Percent", "Opacity", "ParticleScalePercent", "RotationMatrix", "SpeedMax", "ParticleTexture", "MVPMatrix"],
    vertex: "\
        \n\
        precision highp float;\n\
        \n\
        uniform mat4    MVPMatrix;\n\
        uniform float   Percent;\n\
        uniform float   Opacity;\n\
        \n\
        uniform float   ParticleScalePercent;\n\
        uniform mat3    RotationMatrix;\n\
        \n\
        attribute vec2  Position;\n\
        attribute vec2  Center;\n\
        attribute vec2  ParticleTexCoord;\n\
        attribute vec4  Color;\n\
        attribute vec2  LifeSpan;\n\
        \n\
        attribute vec3  Speed;\n\
        uniform float   SpeedMax;\n\
        attribute float Scale;\n\
        \n\
        varying vec4    v_Color;\n\
        varying vec2    v_TexCoord;\n\
        \n\
        float scaleUpDown(float x) {\n\
            float result = 1.0 - abs(2.0*(x-0.5));\n\
            result *= result;\n\
            return result;\n\
        }\n\
        \n\
        void main()\n\
        {\n\
            /* LIFESPAN */\n\
            float realPercent = (Percent-LifeSpan.x)/LifeSpan.y;\n\
            float doDiscard = (realPercent > 1.0 || realPercent < 0.0) ? 0.0 : 1.0;\n\
            realPercent = clamp(realPercent, 0.0,1.0);\n\
            float realPercent2 = realPercent*realPercent;\n\
            float invPercent2 = 1.0-realPercent;\n\
            invPercent2 *= invPercent2;\n\
            \n\
            vec3 scaleDirectionVec = vec3((Position.x-Center.x),(Position.y-Center.y),0);\n\
            \n\
            /* ROTATE */\n\
            vec3 rotatedVec = RotationMatrix * scaleDirectionVec.xyz;\n\
            \n\
            /* SCALE */\n\
            float scalePercent = (LifeSpan.x <= 0.001 ? ParticleScalePercent : scaleUpDown(realPercent));\n\
            float scale = scalePercent * Scale * doDiscard;\n\
            vec4 position = vec4(Center,0,1) + vec4(rotatedVec,0) * scale;\n\
            \n\
            vec3 thisSpeed = Speed * SpeedMax;\n\
            position.xyz += thisSpeed * realPercent*(3.0 + mix(realPercent*realPercent2, 1.0-invPercent2, realPercent2));\n\
            \n\
            // Only adjust opacity on particles that last the duration of the animation\n\
            float thisOpacity = (LifeSpan.x <= 0.001 ? Opacity : 1.0);\n\
            vec4 color = vec4(Color.rgb, 1) * thisOpacity;\n\
            \n\
	        v_Color = color;\n\
            v_TexCoord = ParticleTexCoord;\n\
	        gl_Position = MVPMatrix * position;\n\
        }\n\
        ",
    fragment: "\
        precision mediump float;\n\
        \n\
        uniform sampler2D ParticleTexture;\n\
        \n\
        varying vec4 v_Color;\n\
		varying vec2 v_TexCoord;\n\
        \n\
        void main()\n\
        {\n\
            vec4 color = texture2D(ParticleTexture, v_TexCoord);\n\
            \n\
            color *= v_Color;\n\
            \n\
            gl_FragColor = color;\n\
        }\
        "
};

KNWebGLShader.sparkle = {
    attribNames: ["Scale", "LifeSpan", "Speed", "ParticleTexCoord", "Center", "Position"],
    uniformNames: ["Percent", "Opacity", "Color", "SpeedMax", "ParticleTexture", "MVPMatrix"],
    vertex: "\
        \n\
        precision highp float;\n\
        \n\
        uniform mat4    MVPMatrix;\n\
        uniform float   Percent;\n\
        \n\
        attribute vec2  Position;\n\
        attribute vec2  Center;\n\
        uniform float   Opacity;\n\
        attribute vec2  ParticleTexCoord;\n\
        uniform vec4    Color;\n\
        \n\
        attribute mediump vec3    Speed;\n\
        uniform mediump float    SpeedMax;\n\
        attribute mediump float   Scale;\n\
        attribute mediump vec2    LifeSpan;\n\
        \n\
        varying vec4    v_Color;\n\
        varying vec2    v_TexCoord;\n\
        \n\
        float ReverseSquareOfFloat(float f) {\n\
            return 1.0 - (1.0-f)*(1.0-f);\n\
        }\n\
        \n\
        void main()\n\
        {\n\
            float doDiscard = 0.0;\n\
            float realPercent = (Percent-LifeSpan.x)/LifeSpan.y;\n\
            if (realPercent < 0.0 || realPercent > 1.0) {\n\
                doDiscard = 1.0;\n\
                realPercent = 1.0;\n\
            }\n\
            \n\
            vec4 position;\n\
            vec4 scaleDirectionVec = vec4((Position.x-Center.x),(Position.y-Center.y),0,0);\n\
            \n\
            // SCALE\n\
            float scaleAdjust = realPercent;\n\
            if (scaleAdjust < 0.1) {\n\
                scaleAdjust /= 0.1;\n\
                scaleAdjust = sqrt(scaleAdjust);\n\
            } else {\n\
                scaleAdjust = 1.0-(scaleAdjust-0.1)/0.9;\n\
                scaleAdjust = scaleAdjust*scaleAdjust*scaleAdjust;\n\
            }\n\
            scaleAdjust *= (doDiscard==0.0 ? 1.0 : 0.0);\n\
            position = vec4(Center,0,1) + scaleDirectionVec * scaleAdjust * Scale;\n\
            \n\
            // POSITION\n\
            vec3 thisSpeed = Speed * SpeedMax;\n\
            position += vec4(thisSpeed, 0) * realPercent;\n\
            \n\
            float invPercent = 1.0 - realPercent;\n\
            vec3 rgbColor = mix(Color.rgb, vec3(1,1,1), invPercent*invPercent*invPercent);\n\
            \n\
            /* output */\n\
            gl_Position = MVPMatrix * position;\n\
            v_Color = vec4(rgbColor, (1.0-realPercent*realPercent)*Opacity);\n\
            v_TexCoord = ParticleTexCoord;\n\
        }\
        ",
    fragment: "\
        \n\
        precision mediump float;\n\
        \n\
        uniform sampler2D ParticleTexture;\n\
        \n\
        varying vec4 v_Color;\n\
        varying vec2 v_TexCoord;\n\
        \n\
        void main()\n\
        {\n\
            vec4 texColor = texture2D(ParticleTexture, v_TexCoord);\n\
            \n\
            texColor *= v_Color;\n\
            \n\
            gl_FragColor = texColor;\n\
        }\
        "
};
