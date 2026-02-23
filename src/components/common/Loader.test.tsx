import { render } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import Loader from './Loader';
import React from 'react';

describe('Loader Component', () => {
  it('renders correctly', () => {
    const { container } = render(<Loader />);
    expect(container.querySelector('.loader-container')).toBeInTheDocument();
    expect(container.querySelector('.loader')).toBeInTheDocument();
  });
});
