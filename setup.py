"""
パッケージインストール用スクリプト
"""

import re

from setuptools import setup


def _requires_from_file(filename):
    is_in_packages = False
    requires = []

    with open(filename, encoding="UTF-8") as _f:
        for _r in _f:
            _r = _r.strip()
            if _r == "[project]":
                is_in_packages = True
            elif _r.startswith("["):
                is_in_packages = False
            elif is_in_packages and _r.startswith("dependencies "):
                dep_data = _r.split("=", 1)

                if len(dep_data) == 0:
                    return requires

                for package in re.sub(r'[\["\]]', "", dep_data[1]).split(","):
                    package = package.strip()
                    if package:
                        requires.append(package)

    return requires


setup(
    name="sudden_death",
    version="0.0.1",
    license="MIT",
    description="突然の死(ハリフキダシ)を生成するツール",
    author="koluku",
    url="https://github.com/koluku/sudden-death",
    install_requires=_requires_from_file("pyproject.toml"),
    packages=["sudden_death"],
    package_data={
        "sudden_death": ["py.typed"],
    },
)
