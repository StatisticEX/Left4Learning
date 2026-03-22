---
title: "{{ replace .TranslationBaseName "-" " " | title }}"
subtitle: ""
date: {{ dateFormat "2006-01-02" .Date }}
lastmod: {{ dateFormat "2006-01-02" .Date }}
draft: true
authors: [Yansong Chen]
description: ""
slug: '{{ .TranslationBaseName }}'

tags: []
categories: []
series: []

hiddenFromHomePage: false
hiddenFromSearch: false

featuredImage: ""
featuredImagePreview: ""

summaryContent: "summary"
toc:
  enable: true
  auto: false
math:
  enable: true
lightgallery: true
license: ""
---

<!--more-->