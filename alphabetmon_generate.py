#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
알파벳몬(Alphabetmon) 도감 이미지 자동 생성 스크립트  (학습용 개정판)
====================================================================
- 각 캐릭터 이름이 '해당 알파벳으로 시작하는 영어 단어'입니다.
  (예: B=Bravo, C=Coral, D=Drake ...)  -> 아이가 글자+단어를 함께 학습.
- 캐릭터의 '몸 실루엣'이 그 대문자 모양을 이루도록 프롬프트에 최우선 지시.
  글자는 글씨로 쓰지 않고, 오직 몸 형태로만 나타나게 합니다.
- 진화 계통(baby->mid->final)은 직전 단계 이미지를 참조로 넘겨 일관성 유지.
- 이미 생성된 파일은 건너뛰므로, 중간에 끊겨도 다시 실행하면 이어서 만듭니다.

[사전 준비]
  pip install google-genai pillow
  set GEMINI_API_KEY=발급받은_키          (Windows cmd)
  $env:GEMINI_API_KEY="발급받은_키"        (PowerShell)
  export GEMINI_API_KEY="발급받은_키"      (Mac/Linux)
  * 이미지 생성 모델은 결제(billing) 연결이 필요합니다(무료 한도 0).

[실행]
  python alphabetmon_generate.py                 # 전체
  python alphabetmon_generate.py --only A,B,Z    # 특정 글자 계통만
  python alphabetmon_generate.py --only OMEGA    # 최종 보스만
  python alphabetmon_generate.py --no-ref        # 참조 이미지 없이 생성
  python alphabetmon_generate.py --model gemini-3-pro-image-preview
"""

import os
import sys
import time
import argparse

from google import genai
from google.genai import types

# ----------------------------------------------------------------------------
# 1. 설정
# ----------------------------------------------------------------------------
DEFAULT_MODEL = "gemini-2.5-flash-image"   # 또는 gemini-3.1-flash-image / gemini-3-pro-image-preview
OUTPUT_DIR = "alphabetmon_images"
SLEEP_SEC = 4
MAX_RETRY = 3

# ----------------------------------------------------------------------------
# 2. 공통 아트 스타일
# ----------------------------------------------------------------------------
STYLE = (
    "Official creature-collection monster design in the style of a classic "
    "Japanese monster RPG (Pokemon-like), clean cel-shaded illustration, "
    "bold outlines, vibrant saturated colors, full-body single creature, "
    "centered, three-quarter front view, plain soft gradient background, "
    "high detail, friendly and appealing for children. "
    "Do NOT write any words, letters, numbers, or captions as text on the image; "
    "the alphabet letter must appear ONLY as the shape of the creature's body, "
    "never as written text."
)

# 타입(한글) -> 영어 시각 묘사
TYPE_VIS = {
    "빛":    "radiant golden divine light, glowing halo aura, luminous holy energy",
    "에스퍼": "violet psychic energy, glowing third eye, mystical aura, telekinetic sparks",
    "비행":   "large feathered wings, aerodynamic body, sky and cloud motifs",
    "드래곤": "majestic draconic build, scales, horns, powerful reptilian features",
    "페어리": "soft pastel pink and cyan tones, sparkles, floral and gentle cute features",
    "노말":   "neutral cream and brown tones, simple friendly mammalian shape",
    "격투":   "muscular athletic body, martial-arts bandages, fierce fighting stance",
    "강철":   "chrome metallic armored plating, mechanical joints, polished steel surface",
    "물":    "aquatic body, fins and gills, flowing water, deep blue and teal tones",
    "불꽃":   "blazing flames, ember sparks, fiery orange-red glowing body",
    "전기":   "crackling lightning bolts, electric yellow sparks, charged energy",
    "땅":    "earthen brown rocky hide, sand and soil texture, sturdy grounded build",
    "악":    "shadowy dark body, menacing red eyes, sinister smoky aura, black and purple",
    "바위":   "rugged grey stone armor, boulder-like body, cracked rock texture",
    "풀":    "lush green foliage, leaves and vines, botanical plant body, verdant tones",
    "얼음":   "crystalline ice and frost, pale blue and white, glacial frozen surface",
    "고스트": "translucent ethereal spectral body, ghostly violet glow, wispy haunting aura",
}

def type_to_visual(type_str):
    parts = [t.strip() for t in type_str.replace("·", "/").split("/")]
    return "; ".join(TYPE_VIS.get(t, t) for t in parts)

# ----------------------------------------------------------------------------
# 3. 도감 데이터  (이름이 해당 알파벳으로 시작)
#    EVO_LINES[글자] = {"en": 영어단어, "stages": [(이름, 단계, 타입) x3]}
# ----------------------------------------------------------------------------
EVO_LINES = {
    "B": {"en": "Bravo",     "stages": [("브라비", "baby", "노말"),   ("브라보", "mid", "격투"),   ("브라보곤", "final", "격투/강철")]},
    "C": {"en": "Coral",     "stages": [("코비", "baby", "노말"),     ("코랄", "mid", "물"),       ("코랄곤", "final", "물/드래곤")]},
    "D": {"en": "Drake",     "stages": [("드레비", "baby", "노말"),   ("드레이크", "mid", "땅"),    ("드레이크곤", "final", "땅/드래곤")]},
    "F": {"en": "Flare",     "stages": [("플레비", "baby", "불꽃"),   ("플레어", "mid", "불꽃"),    ("플레어곤", "final", "불꽃/비행")]},
    "G": {"en": "Gamma",     "stages": [("감비", "baby", "전기"),     ("감마", "mid", "전기"),      ("감마곤", "final", "전기/드래곤")]},
    "H": {"en": "Hurricane", "stages": [("허리비", "baby", "비행"),   ("허리케인", "mid", "비행"),  ("허리케곤", "final", "비행/드래곤")]},
    "J": {"en": "Jungle",    "stages": [("정비", "baby", "풀"),       ("정글", "mid", "풀"),        ("정글곤", "final", "풀/땅")]},
    "K": {"en": "Kaiser",    "stages": [("카이비", "baby", "격투"),   ("카이저", "mid", "격투"),    ("카이저곤", "final", "격투/드래곤")]},
    "L": {"en": "Luna",      "stages": [("루나비", "baby", "얼음"),   ("루나", "mid", "얼음"),      ("루나곤", "final", "얼음/페어리")]},
    "M": {"en": "Metal",     "stages": [("메탈비", "baby", "강철"),   ("메탈", "mid", "강철"),      ("메탈곤", "final", "강철/드래곤")]},
    "N": {"en": "Night",     "stages": [("나이비", "baby", "악"),     ("나이트", "mid", "악"),      ("나이트곤", "final", "악/드래곤")]},
    "P": {"en": "Phoenix",   "stages": [("피닉비", "baby", "불꽃"),   ("피닉스", "mid", "불꽃"),    ("피닉곤", "final", "불꽃/페어리")]},
    "Q": {"en": "Quasar",    "stages": [("퀘이비", "baby", "고스트"), ("퀘이사", "mid", "고스트"),  ("퀘이사곤", "final", "고스트/에스퍼")]},
    "R": {"en": "Ray",       "stages": [("레이비", "baby", "에스퍼"), ("레이", "mid", "에스퍼"),    ("레이곤", "final", "에스퍼/드래곤")]},
    "S": {"en": "Storm",     "stages": [("스톰비", "baby", "물"),     ("스톰", "mid", "물"),        ("스톰곤", "final", "물/비행")]},
    "T": {"en": "Titan",     "stages": [("타이비", "baby", "바위"),   ("타이탄", "mid", "바위"),    ("타이탄곤", "final", "바위/강철")]},
    "V": {"en": "Volt",      "stages": [("볼트비", "baby", "전기"),   ("볼트", "mid", "전기"),      ("볼트곤", "final", "전기/강철")]},
    "W": {"en": "Wave",      "stages": [("웨이비", "baby", "물"),     ("웨이브", "mid", "물"),      ("웨이브곤", "final", "물/드래곤")]},
    "X": {"en": "Xeno",      "stages": [("엑시비", "baby", "에스퍼"), ("엑소", "mid", "에스퍼"),    ("엑시온", "final", "에스퍼/악")]},
    "Y": {"en": "Yota",      "stages": [("요타비", "baby", "페어리"), ("요타", "mid", "페어리"),    ("요타곤", "final", "페어리/비행")]},
    "Z": {"en": "Zeta",      "stages": [("제타비", "baby", "드래곤"), ("제타", "mid", "드래곤"),    ("제타곤", "final", "드래곤/전기")]},
}

# 전설의 5대 모음신:  글자 -> (이름, 칭호, 타입, 설정, 영어단어)
VOWEL_GODS = {
    "A": ("알파몬",   "창조의 신", "빛",        "the supreme creator god, the origin of all letters", "Alpha"),
    "E": ("에코몬",   "지혜의 신", "에스퍼",     "the god of wisdom that governs language and knowledge", "Echo"),
    "I": ("아이리스몬", "예언의 신", "에스퍼/비행", "the god of prophecy with all-seeing eyes that view the future", "Iris"),
    "O": ("오르비스몬", "시간의 신", "드래곤",     "the god of time that connects dimensions", "Orbis"),
    "U": ("유니콘몬",  "생명의 신", "페어리",     "the god of life with powerful healing abilities", "Unicorn"),
}

STAGE_DESC = {
    "baby":  "small, round, cute baby form, tiny and charming, big eyes",
    "mid":   "adolescent evolved form, taller and more defined, growing power",
    "final": "powerful fully-evolved final form, large, imposing, dramatic and heroic",
}

# 단계별로 '글자 케이스'를 다르게 지시 -> 진화가 형태로 구분되고 대소문자 학습 효과
STAGE_CASE = {
    "baby":  ("lowercase", "small lowercase letter '{low}'"),
    "mid":   ("transition", "form between lowercase '{low}' and capital '{cap}', mid-transformation"),
    "final": ("uppercase", "bold capital letter '{cap}'"),
}

# ----------------------------------------------------------------------------
# 4. 프롬프트 빌더
# ----------------------------------------------------------------------------
def build_consonant_prompt(letter, name, stage, type_str, en):
    visual = type_to_visual(type_str)
    shape = STAGE_CASE[stage][1].format(low=letter.lower(), cap=letter.upper())
    return (
        f"A cute monster-collection creature designed to help children learn the alphabet. "
        f"MOST IMPORTANT REQUIREMENT: the creature's overall body and silhouette must clearly "
        f"and unmistakably form the shape of the {shape}, so that a child instantly recognizes "
        f"that exact letter shape just by looking at its body. Build the anatomy "
        f"(head, limbs, tail, posture, curves) directly around that letter shape. "
        f"Its name is '{en}', an English word starting with '{letter}'; let the theme of "
        f"'{en}' inspire its look. {STAGE_DESC[stage]}. "
        f"Elemental theme: {visual}. Type: {type_str}. {STYLE}"
    )

def build_vowel_prompt(letter, name, title, type_str, lore, en):
    visual = type_to_visual(type_str)
    return (
        f"A legendary mythical deity creature designed to help children learn the alphabet. "
        f"MOST IMPORTANT REQUIREMENT: its overall body and silhouette must clearly form the "
        f"shape of the capital letter '{letter}', recognizable at a glance, built into its "
        f"divine anatomy. Its name is '{en}', an English word starting with '{letter}'. "
        f"It is {lore}. Divine, awe-inspiring, god-tier legendary creature, epic scale. "
        f"Elemental theme: {visual}. Type: {type_str}. {STYLE}"
    )

def build_omega_prompt():
    return (
        "The ultimate final-boss creature named Alphabetmon Omega, formed when all 26 "
        "letters of the alphabet fuse into one. A colossal godlike being radiating golden "
        "divine light and draconic majesty, surrounded by glowing floating alphabet letters "
        "and runes forming its aura, cosmic background, overwhelming presence, signature "
        "attack 'Omega Alpha Burst' energy crackling around it. Type: Light/Dragon. "
        + STYLE.replace("plain soft gradient background", "epic cosmic background")
    )

# ----------------------------------------------------------------------------
# 5. 생성 작업 목록
# ----------------------------------------------------------------------------
def build_jobs(only=None):
    jobs = []
    sel = set(s.strip().upper() for s in only) if only else None

    for L, (name, title, typ, lore, en) in VOWEL_GODS.items():
        if sel and L not in sel:
            continue
        jobs.append((f"vowel_{L}", f"00_god_{L}_{name}.png",
                     build_vowel_prompt(L, name, title, typ, lore, en), None))

    for L, info in EVO_LINES.items():
        if sel and L not in sel:
            continue
        en = info["en"]
        prev_key = None
        for i, (name, stage, typ) in enumerate(info["stages"], 1):
            key = f"{L}_{i}"
            fn = f"{L}_{i}_{stage}_{name}.png"
            jobs.append((key, fn, build_consonant_prompt(L, name, stage, typ, en), prev_key))
            prev_key = key

    if not sel or "OMEGA" in sel or "Ω" in sel:
        jobs.append(("omega", "99_OMEGA_알파벳몬오메가.png", build_omega_prompt(), None))

    return jobs

# ----------------------------------------------------------------------------
# 6. 이미지 생성
# ----------------------------------------------------------------------------
def extract_image_bytes(response):
    for part in response.candidates[0].content.parts:
        inline = getattr(part, "inline_data", None)
        if inline and inline.data:
            data = inline.data
            if isinstance(data, str):
                import base64
                data = base64.b64decode(data)
            return data
    return None

def generate_one(client, model, prompt, ref_bytes=None):
    contents = [prompt]
    if ref_bytes:
        contents = [
            "Keep the SAME character identity and color scheme as the reference image, "
            "but evolve it into a stronger form. " + prompt,
            types.Part.from_bytes(data=ref_bytes, mime_type="image/png"),
        ]
    resp = client.models.generate_content(
        model=model,
        contents=contents,
        config=types.GenerateContentConfig(response_modalities=["TEXT", "IMAGE"]),
    )
    return extract_image_bytes(resp)

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--only", type=str, default=None, help="특정 글자만. 예: A,B,Z 또는 OMEGA")
    parser.add_argument("--model", type=str, default=DEFAULT_MODEL)
    parser.add_argument("--no-ref", action="store_true", help="진화 참조 이미지 사용 안 함")
    parser.add_argument("--out", type=str, default=OUTPUT_DIR)
    args = parser.parse_args()

    api_key = os.environ.get("GEMINI_API_KEY") or os.environ.get("GOOGLE_API_KEY")
    if not api_key:
        print("[오류] 환경변수 GEMINI_API_KEY 가 설정되어 있지 않습니다.")
        sys.exit(1)

    client = genai.Client(api_key=api_key)
    os.makedirs(args.out, exist_ok=True)

    only = args.only.split(",") if args.only else None
    jobs = build_jobs(only)
    cache = {}

    print(f"총 {len(jobs)}종 생성 시작 (모델: {args.model})\n")

    for idx, (key, fn, prompt, ref_key) in enumerate(jobs, 1):
        path = os.path.join(args.out, fn)
        if os.path.exists(path):
            print(f"[{idx}/{len(jobs)}] 건너뜀(이미 있음): {fn}")
            with open(path, "rb") as f:
                cache[key] = f.read()
            continue

        ref_bytes = cache.get(ref_key) if (not args.no_ref and ref_key) else None

        ok = False
        for attempt in range(1, MAX_RETRY + 1):
            try:
                img = generate_one(client, args.model, prompt, ref_bytes)
                if img:
                    with open(path, "wb") as f:
                        f.write(img)
                    cache[key] = img
                    print(f"[{idx}/{len(jobs)}] 저장 완료: {fn}")
                    ok = True
                    break
                print(f"[{idx}/{len(jobs)}] 이미지 데이터 없음 (시도 {attempt})")
            except Exception as e:
                print(f"[{idx}/{len(jobs)}] 오류 (시도 {attempt}): {e}")
                time.sleep(SLEEP_SEC * attempt)

        if not ok:
            print(f"  -> 실패: {fn} (나중에 다시 실행하면 이어서 시도합니다)")
        time.sleep(SLEEP_SEC)

    print(f"\n완료. 결과 폴더: {os.path.abspath(args.out)}")

if __name__ == "__main__":
    main()
