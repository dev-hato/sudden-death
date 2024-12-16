"""
パッケージインストール用スクリプト
"""

import toml
from setuptools import setup


def _requires_from_file(filename):
    with open(filename, encoding="UTF-8") as _f:
        pyproject = toml.load(_f)
        return pyproject["project"]["dependencies"]


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
