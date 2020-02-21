/**
 * @license
 * Copyright 2017 Google Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { Code, FirestoreError } from '../util/error';
import { primitiveComparator } from '../util/misc';

export class Timestamp {
  // Midnight at the beginning of 1/1/1 is the earliest Firestore supports.
  private static readonly MIN_SECONDS = -62135596800;
  // This will break in the year 10,000.
  private static readonly MAX_SECONDS = 253402300799;
  private static readonly MIN_NANOSECONDS = 0;
  private static readonly MAX_NANOSECONDS = 1e9 - 1;

  static now(): Timestamp {
    return Timestamp.fromMillis(Date.now());
  }

  static fromDate(date: Date): Timestamp {
    return Timestamp.fromMillis(date.getTime());
  }

  static fromMillis(milliseconds: number): Timestamp {
    const seconds = Math.floor(milliseconds / 1000);
    const nanos = (milliseconds - seconds * 1000) * 1e6;
    return new Timestamp(seconds, nanos);
  }

  constructor(readonly seconds: number, readonly nanoseconds: number) {
    if (
      nanoseconds < Timestamp.MIN_NANOSECONDS ||
      nanoseconds > Timestamp.MAX_NANOSECONDS
    ) {
      throw new FirestoreError(
        Code.INVALID_ARGUMENT,
        'Timestamp nanoseconds out of range: ' + nanoseconds
      );
    }

    if (seconds < Timestamp.MIN_SECONDS || seconds > Timestamp.MAX_SECONDS) {
      throw new FirestoreError(
        Code.INVALID_ARGUMENT,
        'Timestamp seconds out of range: ' + seconds
      );
    }
  }

  toDate(): Date {
    return new Date(this.toMillis());
  }

  toMillis(): number {
    return this.seconds * 1000 + this.nanoseconds / 1e6;
  }

  _compareTo(other: Timestamp): number {
    if (this.seconds === other.seconds) {
      return primitiveComparator(this.nanoseconds, other.nanoseconds);
    }
    return primitiveComparator(this.seconds, other.seconds);
  }

  isEqual(other: Timestamp): boolean {
    return (
      other.seconds === this.seconds && other.nanoseconds === this.nanoseconds
    );
  }

  toString(): string {
    return (
      'Timestamp(seconds=' +
      this.seconds +
      ', nanoseconds=' +
      this.nanoseconds +
      ')'
    );
  }

  // Overriding valueOf() allows Timestamp objects to be compared in JavaScript using the
  // arithmetic comparison operators, such as < and >.
  // https://github.com/firebase/firebase-js-sdk/issues/2632
  valueOf(): string {
    const formattedSeconds = Timestamp.normalizeAndPad(
      this.seconds,
      Timestamp.MIN_SECONDS,
      Timestamp.MAX_SECONDS
    );
    const formattedNanoseconds = Timestamp.normalizeAndPad(
      this.nanoseconds,
      Timestamp.MIN_NANOSECONDS,
      Timestamp.MAX_NANOSECONDS
    );
    return formattedSeconds + '.' + formattedNanoseconds;
  }

  private static normalizeAndPad(
    value: number,
    minValue: number,
    maxValue: number
  ): string {
    const padLength = Math.ceil(Math.log10(maxValue - minValue));
    const normalizedValue = value - minValue;
    return normalizedValue.toString().padStart(padLength, '0');
  }
}
